const axios = require("axios");

async function generateAccessToken() {
  const response = await axios({
    url: process.env.PAYPAL_BASE_URL + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_SECRET,
    },
  });

  return response.data.access_token;
}

exports.createOrder = async (listProducts, totalAmount) => {
  try {
    const accessToken = await generateAccessToken();

    const items = listProducts.map((product) => ({
      name: product.name,
      description: "Producto de figuras coleccionables",
      quantity: product.quantity.toString(),
      unit_amount: {
        currency_code: "USD",
        value: product.price.toFixed(2),
      },
    }));

    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: totalAmount,
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: totalAmount,
                },
              },
            },
            items: items,
          },
        ],
       
        application_context: {
            payment_method_preference: "IMMEDIATE_PAYMENT_REQUIRED",
            brand_name: "Haki Store",
            landing_page: "LOGIN",
            shipping_preference: "GET_FROM_FILE",
            user_action: "PAY_NOW",
            return_url: `http://localhost:5173/paypal-return`,
            cancel_url: `${process.env.BASE_URL}/cancel-order`,
        }
      },
    });

    // Devuelve el enlace de aprobación para que el usuario complete el pago
    return response.data.links.find((link) => link.rel === "approve").href;
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw new Error("Error creating PayPal order");
  }
};

// exports.createOrder = async (listProducts,totalAmount) => {
//     const accessToken = await generateAccessToken();

//     const items = listProducts.map(product => ({
//         name: product.name,
//         description: 'Producto de figuras coleccionables',
//         quantity: product.quantity.toString(), // PayPal espera la cantidad como una cadena
//         unit_amount: {
//             currency_code: 'USD',
//             value: product.price.toFixed(2) // Aseguramos que el precio esté en formato correcto
//         }
//     }));

//     const response = await axios({
//         url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
//         method: 'post',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer ' + accessToken
//         },
//         data: JSON.stringify({
//             intent: 'CAPTURE',
//             purchase_units: [
//                 {
//                     amount: {
//                         currency_code: 'USD',
//                         value: totalAmount,
//                         breakdown: {
//                             item_total: {
//                                 currency_code: 'USD',
//                                 value: totalAmount
//                             }
//                         }
//                     },
//                     items: items,
//                 }
//             ],
//             application_context: {
//                 return_url: `http://localhost:5173/paypal-return`,
//                 cancel_url: process.env.BASE_URL + '/cancel-order',
//                 shipping_preference: 'NO_SHIPPING',
//                 user_action: 'PAY_NOW',
//                 brand_name: 'Haki Store'
//             }
//         })
//     });

//     return response.data.links.find(link => link.rel === 'approve').href;
// };

exports.capturePayment = async (orderId) => {
  const accessToken = await generateAccessToken();

  try {
    const response = await axios({
      url:
        process.env.PAYPAL_BASE_URL + `/v2/checkout/orders/${orderId}/capture`,
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error capturing order:", error);
    return {
      success: false,
      error: error.response?.data || "Error capturing order",
    };
  }
};

exports.trackOrder = async (orderId) => {
  const accessToken = await generateAccessToken();

  try {
    const response = await axios({
      url: `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error tracking order:", error);
    return {
      success: false,
      error: error.response?.data || "Error tracking order",
    };
  }
};
