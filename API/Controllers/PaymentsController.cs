using API.Errors;
using Core.Entities;
using Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;
using Order = Core.Entities.OrderAggregate.Order;

namespace API.Controllers
{
    public class PaymentsController : BaseApiController
    {
        private readonly IPaymentService _paymentService;
        private readonly ILogger<PaymentsController> _logger;

        // we use in the Post method underneath. WhSecret tells that smth comes from Stripe and we can trust it
        private readonly string _whSecret; 

        public PaymentsController(IPaymentService paymentService, ILogger<PaymentsController> logger, IConfiguration config)
        {
            _paymentService = paymentService;
            _logger = logger;
            _whSecret = config.GetSection("StripeSettings:WhSecret").Value;
        }

        [Authorize]
        [HttpPost("{basketId}")]
        public async Task<ActionResult<CustomerBasket>> CreateOrUpdatePaymentIntent(string basketId) {
            var basket = await _paymentService.CreateOrUpdatePaymentIntent(basketId);

            if (basket == null) return BadRequest(new ApiResponse(400, "Problem with your basket"));

            return basket;
        }

        [HttpPost("webhook")]
        public async Task<ActionResult> StripeWebhook() {
            // read what Stripe has send to us
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

            var stripeEvent = EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], _whSecret);

            PaymentIntent intent; // comes from Stripe.Net package
            Order order;

            switch (stripeEvent.Type) {
                case "payment_intent.succeeded":
                    intent = (PaymentIntent) stripeEvent.Data.Object;
                    _logger.LogInformation("Payment Succeeded: ", intent.Id);

                    // update order status
                    order = await _paymentService.UpdateOrderPaymentSucceeded(intent.Id);
                    _logger.LogInformation("Order updated to payment received: ", order.Id);
                    break;
                case "payment_intent.payment_failed":
                    intent = (PaymentIntent) stripeEvent.Data.Object;
                    _logger.LogInformation("Payment Failed: ", intent.Id);

                    // update order status
                    order = await _paymentService.UpdateOrderPaymentFailed(intent.Id);     
                    _logger.LogInformation("Payment Failed: ", order.Id);
                    break;
            }

            // here, we tell the Stripe that we`ve received an event
            return new EmptyResult();
        }
    }
}