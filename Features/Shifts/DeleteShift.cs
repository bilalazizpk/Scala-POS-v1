using MediatR;
using ScalaPOS.Data;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Shifts
{
    public record DeleteShiftCommand(int Id) : IRequest<bool>;

    public class DeleteShiftHandler : IRequestHandler<DeleteShiftCommand, bool>
    {
        private readonly PosDbContext _context;

        public DeleteShiftHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<bool> Handle(DeleteShiftCommand request, CancellationToken cancellationToken)
        {
            var shift = await _context.Shifts.FindAsync(new object[] { request.Id }, cancellationToken);
            
            if (shift == null) return false;

            _context.Shifts.Remove(shift);
            await _context.SaveChangesAsync(cancellationToken);
            
            return true;
        }
    }
}
