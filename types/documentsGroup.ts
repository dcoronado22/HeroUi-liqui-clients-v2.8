export const groups = [
    {
        label: "Propietario real (es)",
        documents: [
            "Identificación oficial vigente del propietario real (en caso de que aplique).",
            "CURP.",
            "Fiel propietario real.",
            "Constancia de situación fiscal",
            "Formato KYC (Propietario real)",
        ],
        visible: true
    },
    {
        label: "Aval y/o Obligado solidario. PF.",
        documents: [
            "Copia de Identificación oficial vigente del aval.",
            "Formato firmado por el aval para solicitud de Buró de Crédito.",
            "Declaración o relación patrimonial del Aval.",
            "Datos del RPP y predial pagado año actual de las propiedades de su relación patrimonial.",
            "Copia de comprobante de domicilio particular del aval con menos de 3 meses de antigüedad.",
            "CURP aval.",
            "Constancia de situación fiscal (no mayor a 30 días) del aval.",
            "Copia de Acta de Nacimiento del aval.",
            "Acta de matrimonio en caso de estar casado tanto en sociedad legal como separación de bienes",
            "Formato actuación del cliente (PF)",
        ],
        visible: true
    },
    {
        label: "Aval casado bajo sociedad conyugal",
        documents: [
            "Identificación oficial vigente. Casado (a) bajo sociedad conyugal.",
            "Formato firmado para solicitud de Buró de Crédito. Casado (a) bajo sociedad conyugal.",
            "CURP Casado (a) bajo sociedad conyugal.",
            "Formato actuación del cliente (PF). Casado (a) bajo sociedad conyugal.",
        ],
        visible: true
    },
    {
        label: "Aval PM",
        documents: [
            "Identificación del apoderado(s) y/o representante legal. Aval PM.",
            "Comprobante de domicilio del aval PM hasta 3 meses de antigüedad. A partir de fecha expedición.",
            "Acta Constitutiva de la empresa, modificaciones y poderes con su RPPyC.",
            "Copia de los tres últimos estados de cuenta bancarios. Aval PM.",
            "Estados financieros de máximo 3 meses de antigüedad. Aval PM.",
            "Estados financieros al 31 diciembre del 2022 y 2023 aval PM.",
            "Formato actuación del cliente aval PM.",
        ],
        visible: true
    },
    {
        label: "Internos",
        documents: [
            "AML",
            "CashFlow",
            "Situación fiscal",
            "Autorización firmada del representante legal",
            "Consulta en buró",
            "Autorización de los avales",
            "Consulta de los avales en el buró"
        ],
        visible: true
    },
    {
        label: "Opcional",
        documents: [
            "Estados financieros al 31 diciembre de los últimos 2 años.",
            "Estados financieros de máximo 3 meses de antigüedad.",
            "Documentos con los cuales acredite la legal posesión del establecimiento fiscal.",
            "Copia del permiso o licencia municipal de funcionamiento, año actual."
        ],
        visible: true
    },
    {
        label: "Documentos Ocultos",
        documents: [
            "Anexo 1 del contrato de factoraje financiero",
            "Contrato de factoraje financiero",
            "Cotización de Factoraje",
            "Pagaré Factoraje",
            "Anexo 2 del contrato de factoraje financiero",
            "Anexo 3 del contrato de factoraje financiero",
            "Cotización objeto del financiamiento autorizada por el cliente.",
            "Formato firmado por el representante legal de la empresa para solicitud de Buró de Crédito."
        ],
        visible: false
    }
];