using Core.Entities;

namespace Core.Specifications
{
    // this specification is responsible for counting all items that were returned from the DB
    // after the request was processed but before the pagination was applied 
    // for example, 18 items were returned (all)
    // but after applying pagination only 3 items were returned back to the client
    public class ProductWithFiltersForCountSpecification : BaseSpecification<Product>
    {
        public ProductWithFiltersForCountSpecification(ProductSpecParams productParams)            
            : base(x => 
                (string.IsNullOrEmpty(productParams.Search) || x.Name.ToLower().Contains(productParams.Search)) &&
                (!productParams.BrandId.HasValue || x.ProductBrandId == productParams.BrandId) &&
                (!productParams.TypeId.HasValue || x.ProductTypeId == productParams.TypeId)
            ) {}
    }
}