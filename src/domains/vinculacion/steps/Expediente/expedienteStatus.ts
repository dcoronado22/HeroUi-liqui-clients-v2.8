
export const getExpedienteStatusLabel = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "preparing":
      return "Pendiente";
    case "valid":
      return "Válido";
    case "reviewing":
      return "En revisión";
    case "invalid":
      return "No valido";
    default:
      return "Pendiente";
  }
};