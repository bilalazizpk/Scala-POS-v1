const http = require('http');
const data = JSON.stringify({
  orderNumber: "ORD-12345",
  orderDate: new Date().toISOString(),
  subTotal: 20.0,
  tax: 2.0,
  discount: 0.0,
  totalAmount: 22.0,
  orderStatus: "Completed",
  orderType: "dine-in",
  paymentMethod: "cash",
  paymentStatus: "paid",
  pointsRedeemed: 0,
  pointsDiscountAmount: 0,
  notes: "",
  items: [{ productId: 1, quantity: 1, unitPrice: 20.0, totalPrice: 20.0 }]
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/v1/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
