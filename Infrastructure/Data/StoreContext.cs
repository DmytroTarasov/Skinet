using System.Reflection;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Infrastructure.Data
{
    public class StoreContext : DbContext
    {
        public StoreContext(DbContextOptions<StoreContext> options) : base(options) {}
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductBrand> ProductBrands { get; set; }
        public DbSet<ProductType> ProductTypes { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<DeliveryMethod> DeliveryMethods { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            // here, we check if we are using an Sqlite database
            // if so - then we want to provide a conversion from decimal to double
            // because Sqlite doesn`t support decimal type
            if (Database.ProviderName == "Microsoft.EntityFrameworkCore.Sqlite") {
                foreach(var entityType in modelBuilder.Model.GetEntityTypes()) {
                    var properties = entityType.ClrType.GetProperties()
                        .Where(p => p.PropertyType == typeof(decimal));

                    var dateTimeProperties = entityType.ClrType.GetProperties()
                        .Where(p => p.PropertyType == typeof(DateTimeOffset));

                    foreach(var property in properties) {
                        modelBuilder.Entity(entityType.Name).Property(property.Name)
                            .HasConversion<double>();
                    }

                    foreach(var property in dateTimeProperties) {
                        modelBuilder.Entity(entityType.Name).Property(property.Name)
                            .HasConversion(new DateTimeOffsetToBinaryConverter());
                    }
                }
            }
        }
    }
}