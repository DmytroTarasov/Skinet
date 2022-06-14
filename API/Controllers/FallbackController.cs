using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class FallbackController : Controller
    {
        public IActionResult Index() {
            // return an index.html page which is inside a wwwroot folder
            return PhysicalFile(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "index.html"), "text/HTML");
        }
    }
}