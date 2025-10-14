import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Tipos
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
    // 1. Autenticar no Primavera
    const authResponse = await fetch('https://ws-sotkon.nors.com:443/WebAPI/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: 'geral',
        password: 'Grl.2022',
        company: 'SOTKONPT',
        instance: 'default',
        line: 'professional',
        grant_type: 'password'
      })
    });

    if (!authResponse.ok) {
      throw new Error('Falha na autenticação Primavera');
    }

    const authData: PrimaveraAuth = await authResponse.json();

    // 2. Buscar lista de cargas
    const cargasResponse = await fetch(
      'https://ws-sotkon.nors.com:443/WebAPI/Plataforma/Listas/CarregaLista/adhoc/?listId=6759E512-88D4-11EC-92C4-00155D029322',
      {
        headers: {
          'Authorization': `Bearer ${authData.access_token}`
        }
      }
    );

    if (!cargasResponse.ok) {
      throw new Error('Falha ao buscar cargas do Primavera');
    }

    const cargasList: CargasListResponse = await cargasResponse.json();

    // 3. Processar cada carga
    let linhasInseridas = 0;

    const servicosMap: Record<string, number> = {
      'Nenhum': 1,
      'Transporte': 2,
      'Instalação': 3,
      'Obra civil': 4,
      'Sotkis access': 5,
      'Sotkis level': 6,
      'Sotcare': 7
    };

    for (const carga of cargasList.Data) {
      // Verificar se já existe
      const existe = await prisma.tblPlanningCargas.findFirst({
        where: {
          id_primavera: carga.ID,
          cliente: carga.Cliente,
          mercadoria: carga.MercadoriaaEntregar,
          localizacao: carga.LocaldeEntrega
        }
      });

      if (!existe) {
        // Mapear país
        const countryId = 
          carga.Pais === 'PT' ? 1 :
          carga.Pais === 'SP' ? 2 :
          carga.Pais === 'FR' ? 3 :
          carga.Pais === 'INT' ? 4 : 1;

        // Data default: 31/12/ano atual
        const now = new Date();
        const dataPrevistaDeCarga = new Date(now.getFullYear(), 11, 31, 23, 59, 0);

        // Inserir carga
        const novaCarga = await prisma.tblPlanningCargas.create({
          data: {
            id_primavera: carga.ID,
            cliente: carga.Cliente,
            condicoesDePagamento: carga.CondicoesdePagamento,
            contactosParaEntrega: carga.ContactoParaEntrega,
            countryId: countryId,
            encomendaDoCliente: carga.EncomendadoCliente,
            encomendaPrimavera: carga.EncomendaPrimavera,
            mercadoria: carga.MercadoriaaEntregar,
            mercadoriaQueFaltaEntregar: carga.MercadoriaQueFaltaEntregar,
            prazoDeEntregaPrevisto: carga.DataEntregaPrevista,
            projecto: carga.Projeto,
            localizacao: carga.LocaldeEntrega,
            dataPrevistaDeCarga: dataPrevistaDeCarga,
            estadoId: 1, // NOVA
            dateCreated: new Date(carga.DatadaEncomenda)
          }
        });

        // Inserir serviços
        if (carga.ServicosaRealizar) {
          const servicosArray = carga.ServicosaRealizar.split(',');
          
          for (const servicoNome of servicosArray) {
            const servicoId = servicosMap[servicoNome.trim()];
            if (servicoId) {
              await prisma.tblPlanningCargaServicos.create({
                data: {
                  planningCargaId: novaCarga.id,
                  servicoId: servicoId
                }
              });
            }
          }
        }

        linhasInseridas++;
      }
    }

    return NextResponse.json({ linhasInseridas });

  } catch (error) {
    console.error('Error importing from Primavera:', error);
    return NextResponse.json(
      { error: 'Failed to import from Primavera', linhasInseridas: 0 },
      { status: 500 }
    );
  }
}