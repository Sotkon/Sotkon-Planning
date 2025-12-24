// /api/cargas/[id]/gantt/route.ts
PUT /api/cargas/{orderId}/gantt
Body: {
  startDate: string,
  endDate: string,
  progress: number
}
