using BarberiaSaaS.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BarberiaSaaS.Api.Controllers;

[ApiController]
[Route("api/admin/paypal")]
[Authorize(Roles = "Admin")]
public sealed class PayPalAdminController : ControllerBase
{
    private readonly IPayPalService _payPalService;

    public PayPalAdminController(IPayPalService payPalService)
    {
        _payPalService = payPalService;
    }

    [HttpPost("setup-monthly-plan")]
    public async Task<IActionResult> SetupMonthlyPlan(CancellationToken cancellationToken)
    {
        try
        {
            var result = await _payPalService.EnsureMonthlyPlanAsync(cancellationToken);

            return Ok(new
            {
                result.ProductId,
                result.PlanId,
                result.PlanStatus,
                result.Mode,
                message = "Plan mensual de Barbería SaaS preparado correctamente. Guarda PAYPAL_PRODUCT_ID y PAYPAL_PLAN_ID en Azure para evitar crear duplicados."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
