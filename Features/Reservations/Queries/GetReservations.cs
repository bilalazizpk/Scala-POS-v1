using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace ScalaPOS.Features.Reservations.Queries
{
    public class GetReservationsQuery : IRequest<List<Reservation>>
    {
    }

    public class GetReservationsHandler : IRequestHandler<GetReservationsQuery, List<Reservation>>
    {
        private readonly PosDbContext _context;

        public GetReservationsHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<List<Reservation>> Handle(GetReservationsQuery request, CancellationToken cancellationToken)
        {
            return await _context.Reservations
                .Include(r => r.Table)
                .OrderBy(r => r.ReservationTime)
                .ToListAsync(cancellationToken);
        }
    }
}
