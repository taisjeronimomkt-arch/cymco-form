exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const { nome, empresa, cnpj, email, telefone } = data;

  const ACCESS_TOKEN = process.env.KOMMO_ACCESS_TOKEN;
  const SUBDOMAIN = "cymco"; // cymco.kommo.com

  const payload = [
    {
      name: nome || "Lead sem nome",
      custom_fields_values: [
        empresa && {
          field_code: "COMPANY_NAME",
          values: [{ value: empresa }],
        },
        cnpj && {
          field_code: "CF_CNPJ", // ajuste se necessário
          values: [{ value: cnpj }],
        },
      ].filter(Boolean),
      _embedded: {
        contacts: [
          {
            name: nome || "Lead sem nome",
            custom_fields_values: [
              email && {
                field_code: "EMAIL",
                values: [{ value: email, enum_code: "WORK" }],
              },
              telefone && {
                field_code: "PHONE",
                values: [{ value: telefone, enum_code: "WORK" }],
              },
            ].filter(Boolean),
          },
        ],
      },
    },
  ];

  try {
    const res = await fetch(
      `https://${SUBDOMAIN}.kommo.com/api/v4/leads/complex`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      console.error("Kommo error:", JSON.stringify(result));
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "Kommo API error", detail: result }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: result }),
    };
  } catch (err) {
    console.error("Fetch error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal error", detail: err.message }),
    };
  }
};
