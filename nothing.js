$.ajax({
    url: "/placeorder",
    method: 'post',
    data: {
      total: amount,
      address: address,
      payment: paymentMethod,
      wallet: walletPlace
    },
    success: (response) => {
      console.log(response.order);
      if (response.codSuccess == true) {
        window.location.href = "/orderplaced";
      } else if (response.codFailed == true) {
        swal("Oops!", "Add Address", "error");
      } else {
        if (response.error && response.error === 'ZeroQuantityError') {
          swal("Oops!", "Cannot order a product with zero quantity", "error");
        } else {
          console.log(response.order);
          razorPay(response.order);
          
          // Event listener for payment page close/cancel
          window.addEventListener("unload", function () {
            // Send AJAX request to indicate failed payment
            $.ajax({
              url: "/orderfailed",
              method: 'post',
              success: (response) => {
                console.log("Payment failed");
              },
              error: (error) => {
                console.log(error);
              }
            });
          });
        }
      }
    },
    error: (error) => {
      swal("Oops!", "An error occurred", "error");
      console.log(error);
    }
  });
  