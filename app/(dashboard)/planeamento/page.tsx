// 3. Processamento dos Dados
  const { calendar, ordersLeftPanel } = useMemo(() => {
    const cal: Record<string, any[]> = {};
    const left: any[] = [];

    if (ordersData?.items) {
      ordersData.items.forEach((order: any) => {
        const matches = activeFilters.includes(Number(order.estadoId)) && 
          (!searchText || (order.cliente + order.encomendaPrimavera).toLowerCase().includes(searchText.toLowerCase()));

        if (!matches) return;

        // REGRA NOVA: "Nova" (1) sempre vai para pendentes, mesmo com data
        // Outros estados (2, 3) com data vão para calendário
        const isNova = Number(order.estadoId) === 1;
        
        if (isNova || !order.dataPrevistaDeCarga) {
          // Nova OU sem data → vai para pendentes
          left.push(order);
        } else {
          // Estados 2 ou 3 COM data → vai para calendário
          const date = new Date(order.dataPrevistaDeCarga);
          const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          if (!cal[dateKey]) cal[dateKey] = [];
          cal[dateKey].push(order);
        }
      });
    }
    return { calendar: cal, ordersLeftPanel: left };
  }, [ordersData, activeFilters, searchText]);
