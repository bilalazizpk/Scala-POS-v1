using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Waitlist.Queries
{
    public class GetWaitlistQuery : IRequest<List<WaitlistEntry>>
    {
    }

    public class GetWaitlistHandler : IRequestHandler<GetWaitlistQuery, List<WaitlistEntry>>
    {
        private readonly PosDbContext _context;

        public GetWaitlistHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<List<WaitlistEntry>> Handle(GetWaitlistQuery request, CancellationToken cancellationToken)
        {
            // Usually returns only active waitlist entries, ordered by time they joined
            return await _context.WaitlistEntries
                .Where(w => w.Status == "Waiting" || w.Status == "Notified")
                .OrderBy(w => w.JoinTime)
                .ToListAsync(cancellationToken);
        }
    }
}
