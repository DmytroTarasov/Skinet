namespace Core.Entities.OrderAggregate
{
    public class Order : BaseEntity
    {
        public Order(){}

        public Order(
            IReadOnlyList<OrderItem> orderItems, 
            string buyerEmail, 
            Address shipToAddress, 
            DeliveryMethod deliveryMethod, 
            decimal subtotal,
            string paymentIntentId) // paymentIntentId is needed for stripe
        {
            BuyerEmail = buyerEmail;
            ShipToAddress = shipToAddress;
            DeliveryMethod = deliveryMethod;
            OrderItems = orderItems;
            Subtotal = subtotal;
            PaymentIntentId = paymentIntentId;
        }

        // by this property we will retrieve all orders of the particular user
        public string BuyerEmail { get; set; }
        public DateTimeOffset OrderDate { get; set; } = DateTimeOffset.Now;
        public Address ShipToAddress { get; set; }
        public DeliveryMethod DeliveryMethod { get; set; }
        public IReadOnlyList<OrderItem> OrderItems { get; set; }
        public decimal Subtotal { get; set; } // excludes the delivery price
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public string PaymentIntentId { get; set; }
        public decimal GetTotal() => Subtotal + DeliveryMethod.Price;
    }
}