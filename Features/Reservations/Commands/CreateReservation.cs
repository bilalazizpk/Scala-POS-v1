using MediatR;
using ScalaPOS.Data;
using ScalaPOS.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Reservations.Commands
{
    public class CreateReservationCommand : IRequest<Reservation>
    {
        public int? CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public int PartySize { get; set; }
        public DateTime ReservationTime { get; set; }
        public int? TableId { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateReservationHandler : IRequestHandler<CreateReservationCommand, Reservation>
    {
        private readonly PosDbContext _context;

        public CreateReservationHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<Reservation> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
        {
            var reservation = new Reservation
            {
                CustomerId = request.CustomerId,
                CustomerName = request.CustomerName,
                PhoneNumber = request.PhoneNumber,
                PartySize = request.PartySize,
                ReservationTime = request.ReservationTime,
                TableId = request.TableId,
                Notes = request.Notes,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync(cancellationToken);

            // Fetch table info if TableId is provided to return fully populated object
            if (reservation.TableId.HasValue)
            {
                reservation.Table = await _context.Tables.FindAsync(request.TableId);
            }

            return reservation;
        }
    }
}
