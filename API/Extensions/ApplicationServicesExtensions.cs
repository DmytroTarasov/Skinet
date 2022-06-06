using API.Errors;
using Core.Interfaces;
using Infrastructure.Data;
using Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Extensions
{
    public static class ApplicationServicesExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services) {
            services.AddScoped<IProductRepository, ProductRepository>();
            services.AddScoped<IBasketRepository, BasketRepository>();
            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            services.AddScoped<ITokenService, TokenService>();

            services.Configure<ApiBehaviorOptions>(options => {
                options.InvalidModelStateResponseFactory = actionContext => {
                    // here, we want to shape our response 
                    // to return an array of errors 
                    // (for example, if the user typed a blank username and password in a form)
                    var errors = actionContext.ModelState
                        .Where(e => e.Value.Errors.Count > 0)
                        .SelectMany(x => x.Value.Errors)
                        .Select(x => x.ErrorMessage)
                        .ToArray();
                    
                    var errorResponse = new ApiValidationErrorResponse {
                        Errors = errors
                    };

                    return new BadRequestObjectResult(errorResponse);
                };
            });

            return services;
        }
    }
}