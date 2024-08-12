require('dotenv').config()
const cors = require('cors');
const express = require('express')
const paypal = require('./services/paypal')
const PORT = process.env.PORT
const { stock_products } = require ('./data/products.js');

const app = express()
app.use(express.json());


app.use(cors({
    origin: 'http://localhost:5173'  
}));
app.get('/', (req, res) => {
    res.send('¡API PAYPAL!');
  });


app.get('/products', (req, res)=>{

res.send(stock_products)
});

  app.post('/pay', async (req, res) => {
    const {listProducts , totalAmount } = req.body;
    try {
        const url = await paypal.createOrder(listProducts,totalAmount);
        res.json({ approvalUrl: url });
    } catch (error) {
        res.send('Error: ' + error.message);
    }
});


app.get('/complete-order', async (req, res) => {
    try {
        const response = await paypal.capturePayment(req.query.token)

        res.send(response.data)
    } catch (error) {
        res.send('Error: ' + error )
    }
})


app.post('/track/order', async (req, res) => {
    const { orderId } = req.body;  // Obtener orderId del cuerpo de la solicitud

    if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
    }

    try {
        const response = await paypal.trackOrder(orderId);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: 'Error tracking order: ' + error.message });
    }
});



app.get('/cancel-order', (req, res) => {
    res.redirect('/')
})

app.listen(PORT, () => console.log(`Server started on port ${PORT}`))