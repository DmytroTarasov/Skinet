namespace Core.Entities.OrderAggregate
{
    // this class is actually a 'snapshot' of a product that was being ordered
    // for example, if the product name changes, we want to persist the old product name in the order table
    public class ProductItemOrdered
    {
        public ProductItemOrdered() {}

        public ProductItemOrdered(int productItemId, string productName, string pictureUrl)
        {
            ProductItemId = productItemId;
            ProductName = productName;
            PictureUrl = pictureUrl;
        }

        public int ProductItemId { get; set; }
        public string ProductName { get; set; }
        public string PictureUrl { get; set; }
    }
}