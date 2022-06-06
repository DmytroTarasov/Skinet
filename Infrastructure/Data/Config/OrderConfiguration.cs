using Core.Entities.OrderAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Data.Config
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.OwnsOne(o => o.ShipToAddress, a => 
            {
                a.WithOwner();
            });
            builder.Property(o => o.Status)
                .HasConversion(os => os.ToString(), os => (OrderStatus)Enum.Parse(typeof(OrderStatus), os));
            
            // if we delete an order, OrderItems will be also deleted
            builder.HasMany(o => o.OrderItems)
                .WithOne().OnDelete(DeleteBehavior.Cascade);
        }
    }
}