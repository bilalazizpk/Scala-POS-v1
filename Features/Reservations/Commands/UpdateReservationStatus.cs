using MediatR;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Reservations.Commands
{
    public class UpdateReservationStatusCommand : IRequest<Reservation?>
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateReservationStatusHandler : IRequestHandler<UpdateReservationStatusCommand, Reservation?>
    {
        private readonly PosDbContext _context;

        public UpdateReservationStatusHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<Reservation?> Handle(UpdateReservationStatusCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _context.Reservations.FindAsync(new object[] { request.Id }, cancellationToken);
            
            if (reservation == null) return null;

            reservation.Status = request.Status;
            await _context.SaveChangesAsync(cancellationToken);

            return reservation;
        }
    }
}
