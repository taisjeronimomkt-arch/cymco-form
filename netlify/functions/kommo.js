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

  const { nome, empresa, cnpj, email, telefone,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term } = data;

  const ACCESS_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjQ4MzkzZjAzYWRhZDdkZTlhYjFmOTQxMjllODVjZGQyZWM1N2ZkNDBkYzYxMWE1MjM5YTEwZDRlMzZjNWY1OWY5ZDdmZmZlNzFhY2JmZmExIn0.eyJhdWQiOiJjZWE4YTM1Yi05YmEzLTQ2OTEtOTcxMi1hOTU1MTdhYmI1MTUiLCJqdGkiOiI0ODM5M2YwM2FkYWQ3ZGU5YWIxZjk0MTI5ZTg1Y2RkMmVjNTdmZDQwZGM2MTFhNTIzOWExMGQ0ZTM2YzVmNTlmOWQ3ZmZmZTcxYWNiZmZhMSIsImlhdCI6MTc3OTM3MDIxMywibmJmIjoxNzc5MzcwMjEzLCJleHAiOjE4MTA4NTc2MDAsInN1YiI6IjEzMDM5NDM5IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjM0NDU1NDAzLCJiYXNlX2RvbWFpbiI6ImtvbW1vLmNvbSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJwdXNoX25vdGlmaWNhdGlvbnMiLCJmaWxlcyIsImNybSIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiMWRiNzE0MDMtNWU3Ny00MDk2LWJjYmYtNjJhYWY3NTNkZTgwIiwiYXBpX2RvbWFpbiI6ImFwaS1jLmtvbW1vLmNvbSJ9.XLSMuvUSMNhRla-GIzy7_UIrM139i-TB8EFDzpfJT6zc9MwIav8ao7icibSwDtF4BjyQtgfkM2drRx0CGe59MRBvYtng7eRCNPcOrClqHoTLbODq04_AWCtgJv-yVuM7zs5-r3hT1gJrJUzbr_JqAa9Red_Do9rYopWX1AtRqQlhf7kkWev5rvj_fvTeLjuMC57TbzlhM8wtG2EZ9sDi9mHcJ_yHehJ5yRhQcvyh7_Yl5fH3Scn8UEH0pvq-m3cykyxgjfw_qj-3z0p-Xgll9SKRE1QWIedYZh7D-NsFK74xZDRAQCPfMPXq4tzIFkgHNQABsqkNkytsAJBY49MyRA";
  const SUBDOMAIN = "cymco";

  const utmFields = [
    utm_source   && { field_code: "UTM_SOURCE",   values: [{ value: utm_source }] },
    utm_medium   && { field_code: "UTM_MEDIUM",   values: [{ value: utm_medium }] },
    utm_campaign && { field_code: "UTM_CAMPAIGN", values: [{ value: utm_campaign }] },
    utm_content  && { field_code: "UTM_CONTENT",  values: [{ value: utm_content }] },
    utm_term     && { field_code: "UTM_TERM",     values: [{ value: utm_term }] },
  ].filter(Boolean);

  const payload = [
    {
      name: nome || "Lead sem nome",
      pipeline_id: 10944619,
      status_id: 95897035,
      custom_fields_values: [
        {
          field_id: 818460,
          values: [{ enum_id: 870176 }], // Fonte: Form Claude
        },
        ...utmFields,
      ],
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
        companies: empresa ? [
          {
            name: empresa,
            custom_fields_values: [
              cnpj && {
                field_id: 819820,
                values: [{ value: cnpj }],
              },
            ].filter(Boolean),
          },
        ] : [],
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
