using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace BarberiaSaaS.Api.Models
{
    [Table("TokensConfirmacionRegistro")]
    [Index(nameof(TokenHash), IsUnique = true)]
    public class TokenConfirmacionRegistro
    {
        public int Id { get; set; }

        public int TenantId { get; set; }

        [Required]
        [MaxLength(64)]
        public string TokenHash { get; set; } = string.Empty;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        public DateTime FechaExpiracion { get; set; }

        public DateTime? FechaUso { get; set; }

        public Tenant Tenant { get; set; } = null!;
    }
}