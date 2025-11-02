
// app/superc/components/PayPalButton.tsx
"use client";

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

const PayPalButton = ({ amount }: { amount: string }) => {
  const createOrder = (data: any, actions: any) => {
    return fetch("/api/paypal/orders/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => data.orderID);
  };

  const onApprove = (data: any, actions: any) => {
    return fetch("/api/paypal/orders/capture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderID: data.orderID }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Payment failed');
        }
        return res.json();
      })
      .then((result) => {
        if (result.status === 'COMPLETED') {
          alert("Payment success! The page will now reload.");
          window.location.reload();
        } else {
          alert("Payment did not complete successfully.");
        }
      })
      .catch(err => {
        console.error(err);
        alert("An error occurred during payment.");
      });
  };

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
        components: "buttons",
        currency: "USD",
        intent: "capture",
        disableFunding: "card,credit",
      }}
    >
      <PayPalButtons
        style={{ layout: "vertical" }}
        createOrder={createOrder}
        onApprove={onApprove}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButton;
