using System.Collections;
using Core.Entities;
using Core.Interfaces;

namespace Infrastructure.Data
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly StoreContext _context;
        private Hashtable _repositories;
        public UnitOfWork(StoreContext context)
        {
            _context = context;
        }

        public async Task<int> Complete()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        public IGenericRepository<TEntity> Repository<TEntity>() where TEntity : BaseEntity
        {
            if (_repositories == null) _repositories = new Hashtable(); // if HashTable is not initialized, then initialize it

            var type = typeof(TEntity).Name; // represents a key in a HashTable

            if (!_repositories.ContainsKey(type)) {
                var repositoryType = typeof(GenericRepository<>);

                // create an instance of GenericRepository<TEntity> and pass a context to it
                var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(TEntity)), _context);

                _repositories.Add(type, repositoryInstance); // add this new entry into a HashTable
            }

            return (IGenericRepository<TEntity>) _repositories[type]; // get by key from a HashTable and cast to an interface
        }
    }
}