using System.Linq.Expressions;
using Core.Entities.OrderAggregate;

namespace Core.Specifications
{
    public class OrdersWithItemsAndOrderingSpecification : BaseSpecification<Order>
    {
        // for list of orders of a particular user
        public OrdersWithItemsAndOrderingSpecification(string email) : base(o => o.BuyerEmail == email) {
            AddInclude(o => o.OrderItems);
            AddInclude(o => o.DeliveryMethod);
            AddOrderByDescending(o => o.OrderDate);
        }

        // for an individual order
        public OrdersWithItemsAndOrderingSpecification(int id, string email) 
            : base(o => o.Id == id && o.BuyerEmail == email)
        {
            AddInclude(o => o.OrderItems);
            AddInclude(o => o.DeliveryMethod);
        }
    }
}