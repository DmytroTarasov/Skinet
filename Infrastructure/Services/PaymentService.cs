using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;
using Product = Core.Entities.Product; // alias
using Order = Core.Entities.OrderAggregate.Order;
using Core.Specifications;

namespace Infrastructure.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly IBasketRepository _basketRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IConfiguration _config;

        public PaymentService(IBasketRepository basketRepository, IUnitOfWork unitOfWork,
            IConfiguration config)
        {
            _basketRepository = basketRepository;
            _unitOfWork = unitOfWork;
            _config = config;
        }

        public async Task<CustomerBasket> CreateOrUpdatePaymentIntent(string basketId)
        {
            StripeConfiguration.ApiKey = _config["StripeSettings:SecretKey"];

            var basket = await _basketRepository.GetBasketAsync(basketId);

            if (basket == null) return null;
            
            var shippingPrice = 0m;

            if (basket.DeliveryMethodId.HasValue) {

                // get the delivery method from the db and store the delivery price in a variable
                // (because we don`t trust a price that comes from a client - we only trust a delivery method id)
                var deliveryMethod = await _unitOfWork.Repository<DeliveryMethod>()
                    .GetByIdAsync((int)basket.DeliveryMethodId);
                shippingPrice = deliveryMethod.Price;
            }

            // same for all items in the basket
            foreach(var item in basket.Items) {
                var productItem = await _unitOfWork.Repository<Product>().GetByIdAsync(item.Id);

                // if price of a product in the basket differs from the same product`s price in the db, then 
                // change the price of a product in the basket to the real one
                if (item.Price != productItem.Price) {
                    item.Price = productItem.Price;
                }
            }

            var service = new PaymentIntentService(); // comes from Stripe.Net package

            PaymentIntent intent;

            // create a payment intent
            if (string.IsNullOrEmpty(basket.PaymentIntentId)) {
                var options = new PaymentIntentCreateOptions {
                    Amount = (long) basket.Items.Sum(i => i.Quantity * (i.Price * 100)) + (long) shippingPrice * 100, // how much a client will pay
                    Currency = "usd",
                    PaymentMethodTypes = new List<string> {"card"}
                };

                intent = await service.CreateAsync(options);

                // update the basket fields
                basket.PaymentIntentId = intent.Id;
                basket.ClientSecret = intent.ClientSecret;
            } else { // update an existing payment intent
                var options = new PaymentIntentUpdateOptions {
                    // we will only update an amount to pay
                    Amount = (long) basket.Items.Sum(i => i.Quantity * (i.Price * 100)) + (long) shippingPrice * 100
                };
                await service.UpdateAsync(basket.PaymentIntentId, options);
            }

            await _basketRepository.UpdateBasketAsync(basket); // update the basket
            
            return basket;
        }

        public async Task<Order> UpdateOrderPaymentFailed(string paymentIntentId)
        {
            var spec = new OrderByPaymentIntentIdSpecification(paymentIntentId);
            var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

            if (order == null) return null;

            order.Status = OrderStatus.PaymentFailed;
            _unitOfWork.Repository<Order>().Update(order);
            await _unitOfWork.Complete(); 

            return order;
        }

        public async Task<Order> UpdateOrderPaymentSucceeded(string paymentIntentId)
        {
            var spec = new OrderByPaymentIntentIdSpecification(paymentIntentId);
            var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

            if (order == null) return null;

            order.Status = OrderStatus.PaymentReceived;
            _unitOfWork.Repository<Order>().Update(order);
            await _unitOfWork.Complete();   

            return order;
        }
    }
}