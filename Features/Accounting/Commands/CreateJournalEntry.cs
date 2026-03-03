using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ScalaPOS.Data;
using ScalaPOS.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace ScalaPOS.Features.Accounting.Commands
{
    public class JournalLineDto
    {
        public string AccountCode { get; set; }
        public string Description { get; set; }
        public decimal Debit { get; set; }
        public decimal Credit { get; set; }
    }

    public record CreateJournalEntryCommand(
        DateTime Date,
        string Reference,
        string Description,
        List<JournalLineDto> Lines
    ) : IRequest<JournalEntry>;

    public class CreateJournalEntryValidator : AbstractValidator<CreateJournalEntryCommand>
    {
        public CreateJournalEntryValidator()
        {
            RuleFor(x => x.Reference).NotEmpty();
            RuleFor(x => x.Lines).NotEmpty();
            RuleFor(x => x.Lines).Must(lines => 
                lines != null && 
                lines.Sum(l => l.Debit) == lines.Sum(l => l.Credit))
                .WithMessage("Total debits must equal total credits.");
        }
    }

    public class CreateJournalEntryHandler : IRequestHandler<CreateJournalEntryCommand, JournalEntry>
    {
        private readonly PosDbContext _context;

        public CreateJournalEntryHandler(PosDbContext context)
        {
            _context = context;
        }

        public async Task<JournalEntry> Handle(CreateJournalEntryCommand request, CancellationToken cancellationToken)
        {
            var entry = new JournalEntry
            {
                Date = request.Date != default ? request.Date : DateTime.UtcNow,
                Reference = request.Reference,
                Description = request.Description,
                TotalDebit = request.Lines.Sum(l => l.Debit),
                TotalCredit = request.Lines.Sum(l => l.Credit),
                IsPosted = true,
                CreatedAt = DateTime.UtcNow
            };

            var accountCodes = request.Lines.Select(l => l.AccountCode).Distinct();
            var accounts = await _context.Accounts
                                .Where(a => accountCodes.Contains(a.Code))
                                .ToDictionaryAsync(a => a.Code, a => a.Id, cancellationToken);

            foreach (var line in request.Lines)
            {
                if (!accounts.TryGetValue(line.AccountCode, out int accountId))
                {
                    throw new Exception($"Account code {line.AccountCode} not found in Chart of Accounts.");
                }

                entry.Lines.Add(new JournalLine
                {
                    AccountId = accountId,
                    Description = line.Description ?? request.Description,
                    Debit = line.Debit,
                    Credit = line.Credit
                });
            }

            _context.JournalEntries.Add(entry);
            await _context.SaveChangesAsync(cancellationToken);

            return entry;
        }
    }
}
