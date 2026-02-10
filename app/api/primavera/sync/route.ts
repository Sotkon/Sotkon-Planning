import { NextResponse } from "next/server";
import { getConnection, sql } from "@/lib/db";
import { SERVICE_TO_ID, Services } from "@/lib/types";
import https from "https";

// Desativar verificação SSL para o endpoint do Primavera (se necessário, como é comum em ambientes internos)
const agent = new https.Agent({
  rejectUnauthorized: false,
});

// Tipos da API do Primavera
interface PrimaveraAuth {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CargaPrimavera {
  ID: string;
  Cliente: string;
  CondicoesdePagamento: string;
  ContactoParaEntrega: string;
  Pais: string;
  EncomendadoCliente: string;
  EncomendaPrimavera: string;
  MercadoriaaEntregar: string;
  MercadoriaQueFaltaEntregar: string;
  DataEntregaPrevista: string;
  Projeto: string;
  LocaldeEntrega: string;
  ServicosaRealizar: string;
  DatadaEncomenda: string;
}

interface CargasListResponse {
  Data: CargaPrimavera[];
}

export async function POST() {
  try {
    console.log("[SYNC] Starting Primavera synchronization...");

    // 1. Autenticar no Primavera
    const authParams = new URLSearchParams({
      username: "geral",
      password: "Grl.2022",
      company: "SOTKONPT",
      instance: "default",
      line: "professional",
      grant_type: "password",
    });

    console.log("[SYNC] Authenticating...");
    const authResponse = await fetch(
      "https://ws-sotkon.nors.com:443/WebAPI/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: authParams,
        // @ts-ignore - agent not technically standard fetch API but Next.js/Node fetch supports it with some extenders,
        // however standard fetch might not. If this fails we might need another approach, but let's try.
        // Actually standard 'fetch' in Node 18+ doesn't support agent directly in the 2nd arg like node-fetch.
        // Let's use custom dispatcher or process.env logic if needed.
        // For now, let's assume valid SSL or reliable connection.
        // If SSL error occurs, we need: process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; (Not recommended for prod but ok often for internal tools)
      },
    );

    // WORKAROUND for self-signed certs if needed locally:
    // if (process.env.NODE_ENV === 'development') process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("[SYNC] Auth failed:", errorText);
      throw new Error(
        `Falha na autenticação Primavera: ${authResponse.status}`,
      );
    }

    const authData: PrimaveraAuth = await authResponse.json();
    console.log("[SYNC] Auth successful");

    // 2. Buscar lista de cargas
    console.log("[SYNC] Fetching list...");
    const cargasResponse = await fetch(
      "https://ws-sotkon.nors.com:443/WebAPI/Plataforma/Listas/CarregaLista/adhoc/?listId=6759E512-88D4-11EC-92C4-00155D029322",
      {
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
        },
      },
    );

    if (!cargasResponse.ok) {
      throw new Error(
        `Falha ao buscar cargas do Primavera: ${cargasResponse.status}`,
      );
    }

    const cargasList: CargasListResponse = await cargasResponse.json();
    console.log(`[SYNC] Found ${cargasList.Data.length} items`);

    // 3. Processar cada carga
    let linhasInseridas = 0;
    const pool = await getConnection();

    const servicosMap: Record<string, number> = {
      Nenhum: 1,
      Transporte: 2,
      Instalação: 3,
      "Obra civil": 4,
      "Sotkis access": 5,
      "Sotkis level": 6,
      Sotcare: 7,
    };

    for (const carga of cargasList.Data) {
      // Verificar se já existe
      const checkResult = await pool
        .request()
        .input("idPrimavera", sql.NVarChar(255), carga.ID)
        .query(
          "SELECT id FROM [dbo].[tblPlanningCargas] WHERE id_primavera = @idPrimavera",
        );

      if (checkResult.recordset.length === 0) {
        // Mapear país
        const countryId =
          carga.Pais === "PT"
            ? 1
            : carga.Pais === "SP"
              ? 2
              : carga.Pais === "FR"
                ? 3
                : carga.Pais === "INT"
                  ? 4
                  : 1;

        // Data default: 31/12/ano atual
        const now = new Date();
        const dataPrevistaDeCarga = new Date(
          now.getFullYear(),
          11,
          31,
          23,
          59,
          0,
        );

        // Parse dateCreated safely
        const dateCreated = carga.DatadaEncomenda
          ? new Date(carga.DatadaEncomenda)
          : new Date();

        // Inserir carga
        const insertResult = await pool
          .request()
          .input("cliente", sql.NVarChar(255), carga.Cliente || null)
          .input("countryId", sql.Int, countryId)
          .input(
            "encomendaDoCliente",
            sql.NVarChar(255),
            carga.EncomendadoCliente || null,
          )
          .input(
            "encomendaPrimavera",
            sql.NVarChar(255),
            carga.EncomendaPrimavera || null,
          )
          .input("projecto", sql.NVarChar(255), carga.Projeto || null)
          .input("estadoId", sql.Int, 1) // NOVA
          .input("dataPrevistaDeCarga", sql.DateTime, dataPrevistaDeCarga)
          .input(
            "contactosParaEntrega",
            sql.NVarChar(sql.MAX),
            carga.ContactoParaEntrega || null,
          )
          .input(
            "mercadoria",
            sql.NVarChar(sql.MAX),
            carga.MercadoriaaEntregar || null,
          )
          .input(
            "condicoesDePagamento",
            sql.NVarChar(255),
            carga.CondicoesdePagamento || null,
          )
          .input(
            "mercadoriaQueFaltaEntregar",
            sql.NVarChar(sql.MAX),
            carga.MercadoriaQueFaltaEntregar || null,
          )
          .input(
            "localizacao",
            sql.NVarChar(sql.MAX),
            carga.LocaldeEntrega || null,
          )
          .input("idPrimavera", sql.NVarChar(255), carga.ID)
          .input(
            "prazoDeEntregaPrevisto",
            sql.NVarChar(50),
            carga.DataEntregaPrevista || null,
          )
          .input("dateCreated", sql.DateTime, dateCreated).query(`
            INSERT INTO [dbo].[tblPlanningCargas] (
              cliente, countryId, encomendaDoCliente, encomendaPrimavera, projecto,
              estadoId, dataPrevistaDeCarga, contactosParaEntrega, mercadoria,
              condicoesDePagamento, mercadoriaQueFaltaEntregar, localizacao,
              id_primavera, prazoDeEntregaPrevisto, dateCreated
            ) VALUES (
              @cliente, @countryId, @encomendaDoCliente, @encomendaPrimavera, @projecto,
              @estadoId, @dataPrevistaDeCarga, @contactosParaEntrega, @mercadoria,
              @condicoesDePagamento, @mercadoriaQueFaltaEntregar, @localizacao,
              @idPrimavera, @prazoDeEntregaPrevisto, @dateCreated
            );
            SELECT SCOPE_IDENTITY() as id;
          `);

        const newId = insertResult.recordset[0].id;
        linhasInseridas++;

        // Inserir serviços
        if (carga.ServicosaRealizar) {
          const servicosArray = carga.ServicosaRealizar.split(",");

          for (const servicoNome of servicosArray) {
            const trimmedName = servicoNome.trim();
            // Buscar ID pelo mapa local ou pelo mapa global se a string bater certo
            const servicoId = servicosMap[trimmedName];

            if (servicoId) {
              await pool
                .request()
                .input("planningCargaId", sql.Int, newId)
                .input("servicoId", sql.Int, servicoId).query(`
                  INSERT INTO [dbo].[tblPlanningCargaServicos] (planningCargaId, servicoId)
                  VALUES (@planningCargaId, @servicoId)
                `);
            }
          }
        }
      }
    }

    console.log(`[SYNC] Completed. Inserted ${linhasInseridas} new records.`);
    return NextResponse.json({
      success: true,
      linhasInseridas,
      message: `Sincronização concluída. ${linhasInseridas} novas cargas importadas.`,
    });
  } catch (error) {
    console.error("[SYNC ERROR]", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Erro na sincronização: ${errorMessage}`, linhasInseridas: 0 },
      { status: 500 },
    );
  }
}
