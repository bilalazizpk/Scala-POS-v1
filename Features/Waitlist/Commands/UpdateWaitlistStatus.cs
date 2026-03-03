using MediatR;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Waitlist.Commands
{
    public class UpdateWaitlistStatusCommand : IRequest<WaitlistEntry?>
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateWaitlistStatusHandler : IRequestHandler<UpdateWaitlistStatusCommand, WaitlistEntry?>
    {
        private readonly PosDbContext _context;

        public UpdateWaitlistStatusHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<WaitlistEntry?> Handle(UpdateWaitlistStatusCommand request, CancellationToken cancellationToken)
        {
            var entry = await _context.WaitlistEntries.FindAsync(new object[] { request.Id }, cancellationToken);
            
            if (entry == null) return null;

            entry.Status = request.Status;
            await _context.SaveChangesAsync(cancellationToken);

            return entry;
        }
    }
}
