using System.Text;
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace API.Helpers
{
    // create a custom attribute
    public class CachedAttribute : Attribute, IAsyncActionFilter // filters allow to run some code before or after specific stages
    // during the request pipeline
    {
        private readonly int _timeToLiveSeconds;
        public CachedAttribute(int timeToLiveSeconds)
        {
            _timeToLiveSeconds = timeToLiveSeconds;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var cacheService = context.HttpContext.RequestServices.GetRequiredService<IResponseCacheService>();

            var cacheKey = GenerateCacheKeyFromRequest(context.HttpContext.Request);
            var cachedResponse = await cacheService.GetCachedResponseAsync(cacheKey); // check if this request is already cached

            // if we have a cached value, then we directly return this value to the client
            // (without hitting a controller)
            // if we don`t have a cached value, then we let the controller to handle the request
            if (!string.IsNullOrEmpty(cachedResponse)) { 
                var contentResult = new ContentResult { // comes from Asp.NetCore.Mvc
                    Content = cachedResponse,
                    ContentType = "application/json",
                    StatusCode = 200
                }; 

                context.Result = contentResult;
                return;
            }

            var executedContext = await next(); // move to the controller (no cached value if present)

            // if the controller has handled the request successfully, we will cache the returned value
            // (put it into a Redis DB)
            if (executedContext.Result is OkObjectResult okObjectResult) {
                await cacheService.CacheResponseAsync(cacheKey, 
                    okObjectResult.Value, TimeSpan.FromSeconds(_timeToLiveSeconds));
            }
        }

        // method for generating a cache key for Http request
        // cache key is actually a request path + query params
        private string GenerateCacheKeyFromRequest(HttpRequest request)
        {
            var keyBuilder = new StringBuilder();

            keyBuilder.Append($"{request.Path}");

            // request.Query returns a collection of query params

            // here, we want to order them so each time the query params are the same,
            // the cached response will be send to a client 
            // (in this case, the order of query params doesn`t matter)
            foreach(var (key, value) in request.Query.OrderBy(x => x.Key)) {
                keyBuilder.Append($"|{key}-{value}");
            }

            return keyBuilder.ToString();
        }
    }
}