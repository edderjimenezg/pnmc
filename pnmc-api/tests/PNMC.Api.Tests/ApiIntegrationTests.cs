using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using PNMC.Contracts;
using PNMC.Infrastructure.Data;
using Xunit;

namespace PNMC.Api.Tests;

public sealed class ApiIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly TestWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ApiIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private async Task LoginAsWebmasterAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = "test@pnmc.local",
            Password = "pnmc-master"
        });
        response.EnsureSuccessStatusCode();
    }

    private async Task LoginAsAllyAdminAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = "aliado.admin@pnmc.local",
            Password = "pnmc-aliado-admin"
        });
        response.EnsureSuccessStatusCode();
    }

    private async Task<ExternalRegisterResponse> RegisterAndVerifyExternalPersonAsync(string email)
    {
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/external/auth/register", new ExternalRegisterRequest
        {
            ProfileType = "persona",
            ActorType = "gestor cultural",
            FullName = "Persona Sesion Externa",
            Email = email,
            Phone = "3000000000",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            Password = "ClaveExterna123",
            AcceptTerms = true,
            AcceptDataPolicy = true,
            AuthorizePublicData = true
        });
        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);

        var registered = await registerResponse.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        Assert.NotNull(registered);
        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/external/auth/verify-email", new ExternalVerifyEmailRequest
        {
            Email = email,
            Code = registered!.DebugVerificationCode
        });
        verifyResponse.EnsureSuccessStatusCode();
        return registered;
    }

    private static async Task LoginExternalAsync(HttpClient client, string email, string password = "ClaveExterna123")
    {
        var response = await client.PostAsJsonAsync("/api/v1/external/auth/login", new ExternalLoginRequest
        {
            Email = email,
            Password = password
        });
        response.EnsureSuccessStatusCode();
    }

    private static async Task<string> GetExternalCsrfTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/v1/external/organizations/csrf");
        response.EnsureSuccessStatusCode();
        var token = await response.Content.ReadFromJsonAsync<ExternalCsrfTokenResponse>();
        Assert.NotNull(token);
        Assert.False(string.IsNullOrWhiteSpace(token!.RequestToken));
        return token.RequestToken;
    }

    private static Task<HttpResponseMessage> CreateExternalOrganizationAsync(HttpClient client, string csrfToken, object request)
    {
        var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/external/organizations/")
        {
            Content = JsonContent.Create(request)
        };
        message.Headers.Add("X-CSRF-TOKEN", csrfToken);
        return client.SendAsync(message);
    }

    private static Task<HttpResponseMessage> CreateDraftFestivalAsync(HttpClient client, int organizacionId, string csrfToken, object request)
    {
        var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/externo/organizaciones/{organizacionId}/festivales")
        {
            Content = JsonContent.Create(request)
        };
        message.Headers.Add("X-CSRF-TOKEN", csrfToken);
        return client.SendAsync(message);
    }

    private static Task<HttpResponseMessage> SendFestivalToReviewAsync(HttpClient client, int festivalId, string csrfToken)
    {
        var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/externo/festivales/{festivalId}/enviar-a-revision")
        {
            Content = JsonContent.Create(new { })
        };
        message.Headers.Add("X-CSRF-TOKEN", csrfToken);
        return client.SendAsync(message);
    }

    private static async Task<string> GetInstitutionalCsrfTokenAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/v1/institucional/festivales/csrf");
        response.EnsureSuccessStatusCode();
        var token = await response.Content.ReadFromJsonAsync<TokenAntiforgeryRespuesta>();
        Assert.NotNull(token);
        Assert.False(string.IsNullOrWhiteSpace(token!.RequestToken));
        return token.RequestToken;
    }

    private static Task<HttpResponseMessage> DecideFestivalAsync(HttpClient client, int festivalId, string csrfToken, object request)
    {
        var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/institucional/festivales/{festivalId}/decisiones")
        {
            Content = JsonContent.Create(request)
        };
        message.Headers.Add("X-CSRF-TOKEN", csrfToken);
        return client.SendAsync(message);
    }

    [Fact]
    public async Task Health_Endpoints_ReturnOk()
    {
        var live = await _client.GetAsync("/health/live");
        var ready = await _client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, live.StatusCode);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
        Assert.True(live.Headers.Contains("X-Correlation-ID"));
        Assert.True(ready.Headers.Contains("X-Correlation-ID"));
        Assert.Equal("nosniff", live.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", ready.Headers.GetValues("X-Frame-Options").Single());
    }

    [Fact]
    public async Task Agenda_Endpoint_ReturnsItems()
    {
        var response = await _client.GetAsync("/api/v1/agenda/events?limit=10&offset=0");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<PagedResponse<AgendaEventDto>>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Items);
    }

    [Fact]
    public async Task News_Endpoint_ReturnsItems()
    {
        var response = await _client.GetAsync("/api/v1/news/articles?limit=10&offset=0");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<PagedResponse<NewsArticleDto>>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Items);
    }

    [Fact]
    public async Task News_ContentHtml_IsSanitized_OnWrite_AndRead()
    {
        var upsertRequest = new NewsArticleUpsertRequest
        {
            Title = "Noticia Sanitizada",
            Summary = "Resumen sanitizado",
            Category = "General",
            ContentHtml = "<p onclick=\"alert('x')\">Hola</p><script>alert('boom')</script><a href=\"javascript:alert('x')\">link</a>"
        };

        var upsertResponse = await _client.PostAsJsonAsync("/api/v1/admin/data/news/articles", upsertRequest);
        upsertResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync("/api/v1/news/articles?limit=100&offset=0&q=Noticia%20Sanitizada");
        listResponse.EnsureSuccessStatusCode();

        var listPayload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<NewsArticleDto>>();
        Assert.NotNull(listPayload);
        var item = Assert.Single(listPayload!.Items);

        Assert.DoesNotContain("<script", item.ContentHtml, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", item.ContentHtml, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("javascript:", item.ContentHtml, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Participation_Create_And_Get_ByReference_Works()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "individual",
            ActorTypeLabel = "Registro individual",
            ActorName = "Prueba Integracion",
            Email = "prueba@example.com",
            Phone = "3000000000",
            Department = "Bogota D.C.",
            Municipality = "Bogota D.C.",
            MusicalFields = "Formacion",
            Description = "Registro de prueba",
            Contribution = "Aporte de prueba",
            Consent = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdPayload = await createResponse.Content.ReadFromJsonAsync<ParticipationSubmissionResponse>();
        Assert.NotNull(createdPayload);
        Assert.False(string.IsNullOrWhiteSpace(createdPayload!.Reference));
        Assert.False(string.IsNullOrWhiteSpace(createdPayload.ExternalSyncStatus));

        var readResponse = await _client.GetAsync($"/api/v1/participation/submissions/{createdPayload.Reference}");
        Assert.Equal(HttpStatusCode.OK, readResponse.StatusCode);
    }

    [Fact]
    public async Task Participation_List_ReturnsPagedItems()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "organization",
            ActorName = "Colectivo Test",
            Email = "colectivo@example.com",
            Phone = "3000000000",
            Department = "Antioquia",
            Municipality = "Medellin",
            MusicalFields = "Formacion",
            Description = "Registro de prueba",
            Contribution = "Aporte de prueba",
            Consent = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var listResponse = await _client.GetAsync("/api/v1/participation/submissions?limit=10&offset=0");
        if (!listResponse.IsSuccessStatusCode)
        {
            var errorPayload = await listResponse.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Unexpected status {listResponse.StatusCode}: {errorPayload}");
        }

        var payload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<ParticipationSubmissionSummaryDto>>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Items);
    }

    [Fact]
    public async Task Legacy_MapParticipation_Endpoint_ReturnsExpectedShape()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "individual",
            ActorName = "Legacy Test",
            Email = "legacy@example.com",
            Phone = "3000000000",
            Department = "Bogota D.C.",
            Municipality = "Bogota D.C.",
            MusicalFields = "Formacion",
            Description = "Registro legado",
            Contribution = "Aporte legado",
            Consent = true
        };

        var response = await _client.PostAsJsonAsync("/api/map-participation", request);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(payload);
        Assert.True(payload!.ContainsKey("reference"));
        Assert.True(payload.ContainsKey("message"));
    }

    [Fact]
    public async Task Admin_Data_Upsert_Agenda_Then_Read_Works()
    {
        var upsertRequest = new AgendaEventUpsertRequest
        {
            Id = string.Empty,
            Title = "Evento Administrado",
            Description = "Registro por endpoint admin",
            Category = "Concierto",
            Date = "2026-09-12",
            TimeLabel = "7:00 PM",
            Location = "Teatro Municipal",
            Municipality = "Medellin",
            Department = "Antioquia",
            Organizer = "Equipo PNMC",
            Tags = ["Piloto", "Backend"]
        };

        var upsertResponse = await _client.PostAsJsonAsync("/api/v1/admin/data/agenda/events", upsertRequest);
        upsertResponse.EnsureSuccessStatusCode();

        var readResponse = await _client.GetAsync("/api/v1/agenda/events?limit=100&offset=0");
        readResponse.EnsureSuccessStatusCode();
        var payload = await readResponse.Content.ReadFromJsonAsync<PagedResponse<AgendaEventDto>>();

        Assert.NotNull(payload);
        Assert.Contains(payload!.Items, item => item.Title == "Evento Administrado");
    }

    [Fact]
    public async Task Admin_Data_Schema_ReturnsFieldDefinitions()
    {
        var response = await _client.GetAsync("/api/v1/admin/data/schema");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(payload);
        Assert.True(payload!.ContainsKey("agenda"));
        Assert.True(payload.ContainsKey("participation"));
        Assert.True(payload.ContainsKey("gallery"));
    }

    [Fact]
    public async Task Ally_Request_Can_Be_Created_Reviewed_And_Approved()
    {
        var request = new AdminAllyRequestCreateRequest
        {
            EntityName = "Red Aliada Test",
            EntityType = "red",
            Nit = "900123456",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            InstitutionalEmail = "contacto@redaliada.test",
            InstitutionalPhone = "3000000000",
            AdminName = "Admin Aliado",
            AdminEmail = "admin@redaliada.test"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/ally-requests", request);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<AdminAllyRequestDto>();
        Assert.NotNull(created);
        Assert.Equal("pendiente", created!.Status);

        var approveResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/ally-requests/{created.Id}/status",
            new AdminAllyRequestStatusRequest
            {
                Status = "aprobada",
                Comment = "Solicitud verificada en prueba."
            });
        approveResponse.EnsureSuccessStatusCode();

        var approved = await approveResponse.Content.ReadFromJsonAsync<AdminAllyRequestDto>();
        Assert.NotNull(approved);
        Assert.Equal("aprobada", approved!.Status);
        Assert.False(string.IsNullOrWhiteSpace(approved.AllyEntityId));

        var listResponse = await _client.GetAsync("/api/v1/admin/ally-requests?status=aprobada");
        listResponse.EnsureSuccessStatusCode();
        var listPayload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<AdminAllyRequestDto>>();
        Assert.NotNull(listPayload);
        Assert.Contains(listPayload!.Items, item => item.Id == created.Id);
    }

    [Fact]
    public async Task External_User_Can_Register_As_Person_With_Email_Pending()
    {
        var request = new ExternalRegisterRequest
        {
            ProfileType = "persona",
            ActorType = "gestor cultural",
            FullName = "Persona Externa Test",
            Email = "persona.externa@example.com",
            Phone = "3000000000",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            Password = "ClaveExterna123",
            AcceptTerms = true,
            AcceptDataPolicy = true,
            AuthorizePublicData = true
        };

        var response = await _client.PostAsJsonAsync("/api/v1/external/auth/register", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        Assert.NotNull(payload);
        Assert.Equal("correo_pendiente", payload!.AccountStatus);
        Assert.Equal("codigo_generado", payload.VerificationStatus);

        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/external/auth/verify-email", new ExternalVerifyEmailRequest
        {
            Email = request.Email,
            Code = payload.DebugVerificationCode
        });
        Assert.Equal(HttpStatusCode.OK, verifyResponse.StatusCode);

        var verified = await verifyResponse.Content.ReadFromJsonAsync<ExternalVerifyEmailResponse>();
        Assert.NotNull(verified);
        Assert.Equal("activo", verified!.AccountStatus);
    }

    [Fact]
    public async Task External_Register_Rejects_Organization_As_Account_Type()
    {
        var request = new ExternalRegisterRequest
        {
            ProfileType = "organizacion",
            ActorType = "festival",
            OrganizationName = "Organizacion Externa Test",
            ContactName = "Contacto Principal",
            Email = "organizacion.externa@example.com",
            Phone = "3000000001",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            Password = "ClaveOrganizacion123",
            AcceptTerms = true,
            AcceptDataPolicy = true,
            AuthorizePublicData = true
        };

        var response = await _client.PostAsJsonAsync("/api/v1/external/auth/register", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("cuenta externa corresponde a una persona", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task External_Verified_User_Can_Login_Read_Session_And_Logout()
    {
        const string email = "sesion.externa@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);

        var loginResponse = await _client.PostAsJsonAsync("/api/v1/external/auth/login", new ExternalLoginRequest
        {
            Email = email,
            Password = "ClaveExterna123"
        });
        loginResponse.EnsureSuccessStatusCode();
        var session = await loginResponse.Content.ReadFromJsonAsync<ExternalSessionResponse>();
        Assert.NotNull(session);
        Assert.Equal(email, session!.Email);
        Assert.Equal("activo", session.AccountStatus);

        var meResponse = await _client.GetAsync("/api/v1/external/auth/me");
        meResponse.EnsureSuccessStatusCode();
        var me = await meResponse.Content.ReadFromJsonAsync<ExternalSessionResponse>();
        Assert.NotNull(me);
        Assert.Equal(session.UserId, me!.UserId);

        var logoutResponse = await _client.PostAsync("/api/v1/external/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
        var afterLogout = await _client.GetAsync("/api/v1/external/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, afterLogout.StatusCode);
    }

    [Fact]
    public async Task External_Login_Rejects_Unverified_And_Invalid_Credentials()
    {
        const string email = "no.verificada@example.com";
        var request = new ExternalRegisterRequest
        {
            ProfileType = "persona",
            ActorType = "gestor cultural",
            FullName = "Persona Sin Verificar",
            Email = email,
            Phone = "3000000000",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            Password = "ClaveExterna123",
            AcceptTerms = true,
            AcceptDataPolicy = true,
            AuthorizePublicData = true
        };
        var registerResponse = await _client.PostAsJsonAsync("/api/v1/external/auth/register", request);
        registerResponse.EnsureSuccessStatusCode();
        var registered = await registerResponse.Content.ReadFromJsonAsync<ExternalRegisterResponse>();

        var unverifiedLogin = await _client.PostAsJsonAsync("/api/v1/external/auth/login", new ExternalLoginRequest
        {
            Email = email,
            Password = request.Password
        });
        Assert.Equal(HttpStatusCode.Unauthorized, unverifiedLogin.StatusCode);

        var verifyResponse = await _client.PostAsJsonAsync("/api/v1/external/auth/verify-email", new ExternalVerifyEmailRequest
        {
            Email = email,
            Code = registered!.DebugVerificationCode
        });
        verifyResponse.EnsureSuccessStatusCode();

        var invalidLogin = await _client.PostAsJsonAsync("/api/v1/external/auth/login", new ExternalLoginRequest
        {
            Email = email,
            Password = "ClaveIncorrecta123"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, invalidLogin.StatusCode);
    }

    [Fact]
    public async Task External_Session_Cannot_Access_Institutional_Endpoints_Or_Login()
    {
        const string email = "aislamiento.externo@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);
        var loginResponse = await _client.PostAsJsonAsync("/api/v1/external/auth/login", new ExternalLoginRequest
        {
            Email = email,
            Password = "ClaveExterna123"
        });
        loginResponse.EnsureSuccessStatusCode();

        var institutionalUsers = await _client.GetAsync("/api/v1/admin/auth/users");
        Assert.Equal(HttpStatusCode.Unauthorized, institutionalUsers.StatusCode);

        var institutionalLogin = await _client.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = email,
            Password = "ClaveExterna123"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, institutionalLogin.StatusCode);
    }

    [Fact]
    public async Task Institutional_Session_Is_Not_An_External_Session()
    {
        await LoginAsWebmasterAsync();

        var externalMe = await _client.GetAsync("/api/v1/external/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, externalMe.StatusCode);
    }

    [Fact]
    public async Task External_User_Can_Create_Organization_With_Initial_Administrator_And_Csrf()
    {
        const string email = "admin.organizacion@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);
        await LoginExternalAsync(_client, email);
        var csrfToken = await GetExternalCsrfTokenAsync(_client);

        var response = await CreateExternalOrganizationAsync(_client, csrfToken, new
        {
            name = "Fundacion Organizacion Test",
            identificationNumber = "900123456-7",
            contactEmail = "contacto@organizacion.test",
            coverageLevel = "municipal",
            departmentCode = "05",
            municipalityCode = "05001",
            administratorUserId = 999
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var organization = await response.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        Assert.NotNull(organization);
        Assert.Equal("administrador", organization!.AdministratorRole);
        Assert.Equal("registrada", organization.Status);
        Assert.Equal("900123456-7", organization.IdentificationNumber);

        var readResponse = await _client.GetAsync($"/api/v1/external/organizations/{organization.Id}");
        readResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task External_Organization_Creation_Rejects_Missing_Session_And_Csrf()
    {
        var withoutSession = await _client.PostAsJsonAsync("/api/v1/external/organizations/", new
        {
            name = "Organizacion Sin Sesion",
            contactEmail = "contacto@sin-sesion.test",
            coverageLevel = "nacional"
        });
        Assert.Equal(HttpStatusCode.Unauthorized, withoutSession.StatusCode);

        const string email = "csrf.organizacion@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);
        await LoginExternalAsync(_client, email);
        var withoutCsrf = await _client.PostAsJsonAsync("/api/v1/external/organizations/", new
        {
            name = "Organizacion Sin Token",
            contactEmail = "contacto@sin-token.test",
            coverageLevel = "nacional"
        });
        Assert.Equal(HttpStatusCode.BadRequest, withoutCsrf.StatusCode);
    }

    [Fact]
    public async Task Institutional_Or_Another_External_User_Cannot_Administer_External_Organization()
    {
        const string ownerEmail = "propietaria.organizacion@example.com";
        await RegisterAndVerifyExternalPersonAsync(ownerEmail);
        await LoginExternalAsync(_client, ownerEmail);
        var csrfToken = await GetExternalCsrfTokenAsync(_client);
        var createResponse = await CreateExternalOrganizationAsync(_client, csrfToken, new
        {
            name = "Organizacion Protegida",
            contactEmail = "contacto@protegida.test",
            coverageLevel = "nacional"
        });
        createResponse.EnsureSuccessStatusCode();
        var organization = await createResponse.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        Assert.NotNull(organization);

        var institutionalClient = _factory.CreateClient();
        var institutionalLogin = await institutionalClient.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = "test@pnmc.local",
            Password = "pnmc-master"
        });
        institutionalLogin.EnsureSuccessStatusCode();
        var institutionalRead = await institutionalClient.GetAsync($"/api/v1/external/organizations/{organization!.Id}");
        Assert.Equal(HttpStatusCode.Unauthorized, institutionalRead.StatusCode);

        var otherClient = _factory.CreateClient();
        var otherRegister = await otherClient.PostAsJsonAsync("/api/v1/external/auth/register", new ExternalRegisterRequest
        {
            ProfileType = "persona",
            ActorType = "gestor cultural",
            FullName = "Otra Persona Externa",
            Email = "tercera.organizacion@example.com",
            Phone = "3000000000",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            Password = "ClaveExterna123",
            AcceptTerms = true,
            AcceptDataPolicy = true,
            AuthorizePublicData = true
        });
        otherRegister.EnsureSuccessStatusCode();
        var otherAccount = await otherRegister.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        var verifyOther = await otherClient.PostAsJsonAsync("/api/v1/external/auth/verify-email", new ExternalVerifyEmailRequest
        {
            Email = "tercera.organizacion@example.com",
            Code = otherAccount!.DebugVerificationCode
        });
        verifyOther.EnsureSuccessStatusCode();
        await LoginExternalAsync(otherClient, "tercera.organizacion@example.com");

        var otherRead = await otherClient.GetAsync($"/api/v1/external/organizations/{organization.Id}");
        Assert.Equal(HttpStatusCode.Forbidden, otherRead.StatusCode);
    }

    [Fact]
    public async Task External_Administrator_Can_Create_Private_Festival_Draft_With_Catalogs_And_Audit()
    {
        const string email = "festival.borrador@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);
        await LoginExternalAsync(_client, email);
        var csrfToken = await GetExternalCsrfTokenAsync(_client);
        var organizationResponse = await CreateExternalOrganizationAsync(_client, csrfToken, new
        {
            name = "Fundación Festival Borrador",
            contactEmail = "contacto@festival-borrador.test",
            coverageLevel = "municipal",
            departmentCode = "05",
            municipalityCode = "05001"
        });
        organizationResponse.EnsureSuccessStatusCode();
        var organization = await organizationResponse.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        Assert.NotNull(organization);

        var festivalResponse = await CreateDraftFestivalAsync(_client, int.Parse(organization!.Id), csrfToken, new
        {
            nombre = "Festival Borrador Protegido",
            descripcion = "Identidad estable del Festival",
            periodicidad = "anual",
            correoContacto = "festival@borrador.test",
            nivelCobertura = "municipal",
            codigoDepartamento = "05",
            codigoMunicipio = "05001",
            practicasMusicalesIds = new[] { 1 },
            territoriosSonorosIds = new[] { 1 },
            personaId = 999,
            administradorId = 999
        });
        Assert.True(festivalResponse.StatusCode == HttpStatusCode.Created, await festivalResponse.Content.ReadAsStringAsync());
        var festival = await festivalResponse.Content.ReadFromJsonAsync<FestivalBorradorDto>();
        Assert.NotNull(festival);
        Assert.Equal("Borrador", festival!.Estado);
        Assert.Equal(organization.Id, festival.OrganizacionPrincipalId);
        Assert.Single(festival.PracticasMusicales);
        Assert.Single(festival.TerritoriosSonoros);

        var ownFestivals = await _client.GetFromJsonAsync<List<FestivalBorradorDto>>($"/api/v1/externo/organizaciones/{organization.Id}/festivales");
        Assert.Contains(ownFestivals!, item => item.Id == festival.Id && item.Estado == "Borrador");

        var publicFestivals = await _client.GetFromJsonAsync<PagedResponse<FestivalDto>>("/api/v1/festivals?limit=100&offset=0");
        Assert.DoesNotContain(publicFestivals!.Items, item => item.Name == "Festival Borrador Protegido");

        var mapResponse = await _client.GetFromJsonAsync<MapSummaryResponseDto>("/api/v1/map/summary?layer=Festivales");
        var antioquia = Assert.Single(mapResponse!.Items, item => item.Department == "Antioquia");
        Assert.True(antioquia.Festivals >= 1);
    }

    [Fact]
    public async Task Festival_Draft_Creation_Rejects_Missing_Sessions_Csrf_And_Organization_Authorization()
    {
        var withoutSession = await _client.PostAsJsonAsync("/api/v1/externo/organizaciones/1/festivales", new { nombre = "Sin sesión" });
        Assert.Equal(HttpStatusCode.Unauthorized, withoutSession.StatusCode);

        const string ownerEmail = "festival.propietaria@example.com";
        await RegisterAndVerifyExternalPersonAsync(ownerEmail);
        await LoginExternalAsync(_client, ownerEmail);
        var csrfToken = await GetExternalCsrfTokenAsync(_client);
        var organizationResponse = await CreateExternalOrganizationAsync(_client, csrfToken, new
        {
            name = "Organización Festival Protegida",
            contactEmail = "contacto@festival-protegido.test",
            coverageLevel = "nacional"
        });
        organizationResponse.EnsureSuccessStatusCode();
        var organization = await organizationResponse.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        Assert.NotNull(organization);

        var withoutCsrf = await _client.PostAsJsonAsync($"/api/v1/externo/organizaciones/{organization!.Id}/festivales", new
        {
            nombre = "Festival sin token", nivelCobertura = "nacional"
        });
        Assert.Equal(HttpStatusCode.BadRequest, withoutCsrf.StatusCode);

        var institutionalClient = _factory.CreateClient();
        await institutionalClient.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest { Email = "test@pnmc.local", Password = "pnmc-master" });
        var institutionalCsrf = await institutionalClient.GetAsync("/api/v1/external/organizations/csrf");
        Assert.Equal(HttpStatusCode.Unauthorized, institutionalCsrf.StatusCode);
        var institutionalCreate = await institutionalClient.PostAsJsonAsync($"/api/v1/externo/organizaciones/{organization.Id}/festivales", new { nombre = "Festival institucional", nivelCobertura = "nacional" });
        Assert.Equal(HttpStatusCode.Unauthorized, institutionalCreate.StatusCode);

        var otherClient = _factory.CreateClient();
        var registration = await otherClient.PostAsJsonAsync("/api/v1/external/auth/register", new ExternalRegisterRequest
        {
            ProfileType = "persona", FullName = "Otra persona", Email = "festival.otra@example.com", Password = "ClaveExterna123", AcceptTerms = true, AcceptDataPolicy = true
        });
        var otherAccount = await registration.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        await otherClient.PostAsJsonAsync("/api/v1/external/auth/verify-email", new ExternalVerifyEmailRequest { Email = "festival.otra@example.com", Code = otherAccount!.DebugVerificationCode });
        await LoginExternalAsync(otherClient, "festival.otra@example.com");
        var otherCsrf = await GetExternalCsrfTokenAsync(otherClient);
        var otherCreate = await CreateDraftFestivalAsync(otherClient, int.Parse(organization.Id), otherCsrf, new { nombre = "Festival ajeno", nivelCobertura = "nacional" });
        Assert.Equal(HttpStatusCode.Forbidden, otherCreate.StatusCode);
    }

    [Fact]
    public async Task External_Administrator_Can_Send_Valid_Festival_Draft_To_Review_Without_Publication()
    {
        const string email = "festival.revision@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);
        await LoginExternalAsync(_client, email);
        var csrfToken = await GetExternalCsrfTokenAsync(_client);
        var organizationResponse = await CreateExternalOrganizationAsync(_client, csrfToken, new
        {
            name = "Organización Festival Revisión",
            contactEmail = "contacto@festival-revision.test",
            coverageLevel = "municipal",
            departmentCode = "05",
            municipalityCode = "05001"
        });
        organizationResponse.EnsureSuccessStatusCode();
        var organization = await organizationResponse.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        Assert.NotNull(organization);
        var creationToken = await GetExternalCsrfTokenAsync(_client);
        var festivalResponse = await CreateDraftFestivalAsync(_client, int.Parse(organization!.Id), creationToken, new
        {
            nombre = "Festival Enviado a Revisión",
            nivelCobertura = "municipal",
            codigoDepartamento = "05",
            codigoMunicipio = "05001"
        });
        festivalResponse.EnsureSuccessStatusCode();
        var festival = await festivalResponse.Content.ReadFromJsonAsync<FestivalBorradorDto>();
        Assert.NotNull(festival);

        var reviewToken = await GetExternalCsrfTokenAsync(_client);
        var reviewResponse = await SendFestivalToReviewAsync(_client, int.Parse(festival!.Id), reviewToken);
        Assert.Equal(HttpStatusCode.OK, reviewResponse.StatusCode);
        var reviewed = await reviewResponse.Content.ReadFromJsonAsync<FestivalBorradorDto>();
        Assert.Equal("EnRevision", reviewed!.Estado);
        Assert.Equal(festival.Id, reviewed.Id);

        var duplicateToken = await GetExternalCsrfTokenAsync(_client);
        var duplicateResponse = await SendFestivalToReviewAsync(_client, int.Parse(festival.Id), duplicateToken);
        Assert.Equal(HttpStatusCode.Conflict, duplicateResponse.StatusCode);

        var publicFestivals = await _client.GetFromJsonAsync<PagedResponse<FestivalDto>>("/api/v1/festivals?limit=100&offset=0");
        Assert.DoesNotContain(publicFestivals!.Items, item => item.Name == "Festival Enviado a Revisión");
        var mapResponse = await _client.GetFromJsonAsync<MapSummaryResponseDto>("/api/v1/map/summary?layer=Festivales");
        Assert.True(Assert.Single(mapResponse!.Items, item => item.Department == "Antioquia").Festivals >= 1);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PnmcDbContext>();
        var audit = db.AuditLogs.Single(item => item.RecordId == festival.Id && item.Action == "FestivalEnviadoARevision");
        Assert.Contains("Borrador", audit.PreviousValuesJson);
        Assert.Contains("EnRevision", audit.NewValuesJson);
        var notification = db.Notifications.Single(item => item.RecordId == festival.Id && item.EventType == "FestivalEnviadoARevision");
        Assert.Equal("enviada", notification.Status);
        Assert.Equal(email, notification.RecipientEmail);
    }

    [Fact]
    public async Task Festival_Review_Requires_External_Authorization_Csrf_And_Complete_Draft()
    {
        var withoutSession = await _client.PostAsJsonAsync("/api/v1/externo/festivales/1/enviar-a-revision", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, withoutSession.StatusCode);

        const string ownerEmail = "festival.autorizacion.revision@example.com";
        await RegisterAndVerifyExternalPersonAsync(ownerEmail);
        await LoginExternalAsync(_client, ownerEmail);
        var csrfToken = await GetExternalCsrfTokenAsync(_client);
        var organizationResponse = await CreateExternalOrganizationAsync(_client, csrfToken, new
        {
            name = "Organización Revisión Protegida",
            contactEmail = "contacto@revision-protegida.test",
            coverageLevel = "municipal",
            departmentCode = "05",
            municipalityCode = "05001"
        });
        organizationResponse.EnsureSuccessStatusCode();
        var organization = await organizationResponse.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        var creationToken = await GetExternalCsrfTokenAsync(_client);
        var festivalResponse = await CreateDraftFestivalAsync(_client, int.Parse(organization!.Id), creationToken, new
        {
            nombre = "Festival Protegido para Revisión", nivelCobertura = "municipal", codigoDepartamento = "05", codigoMunicipio = "05001"
        });
        var festival = await festivalResponse.Content.ReadFromJsonAsync<FestivalBorradorDto>();
        Assert.NotNull(festival);

        var withoutCsrf = await _client.PostAsJsonAsync($"/api/v1/externo/festivales/{festival!.Id}/enviar-a-revision", new { });
        Assert.Equal(HttpStatusCode.BadRequest, withoutCsrf.StatusCode);

        var institutionalClient = _factory.CreateClient();
        await institutionalClient.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest { Email = "test@pnmc.local", Password = "pnmc-master" });
        var institutionalResponse = await institutionalClient.PostAsJsonAsync($"/api/v1/externo/festivales/{festival.Id}/enviar-a-revision", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, institutionalResponse.StatusCode);

        var otherClient = _factory.CreateClient();
        var registration = await otherClient.PostAsJsonAsync("/api/v1/external/auth/register", new ExternalRegisterRequest
        {
            ProfileType = "persona", FullName = "Otra persona de revisión", Email = "festival.ajeno.revision@example.com", Password = "ClaveExterna123", AcceptTerms = true, AcceptDataPolicy = true
        });
        var otherAccount = await registration.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        await otherClient.PostAsJsonAsync("/api/v1/external/auth/verify-email", new ExternalVerifyEmailRequest { Email = "festival.ajeno.revision@example.com", Code = otherAccount!.DebugVerificationCode });
        await LoginExternalAsync(otherClient, "festival.ajeno.revision@example.com");
        var otherToken = await GetExternalCsrfTokenAsync(otherClient);
        var otherResponse = await SendFestivalToReviewAsync(otherClient, int.Parse(festival.Id), otherToken);
        Assert.Equal(HttpStatusCode.Forbidden, otherResponse.StatusCode);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PnmcDbContext>();
            var incomplete = db.FestivalRecords.Single(item => item.Id == int.Parse(festival.Id));
            incomplete.Name = string.Empty;
            db.SaveChanges();
        }
        var incompleteToken = await GetExternalCsrfTokenAsync(_client);
        var incompleteResponse = await SendFestivalToReviewAsync(_client, int.Parse(festival.Id), incompleteToken);
        Assert.Equal(HttpStatusCode.BadRequest, incompleteResponse.StatusCode);
    }

    [Fact]
    public async Task Institutional_Review_Requests_Adjustments_Then_Publishes_And_Preserves_History()
    {
        const string email = "festival.decision.institucional@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);
        await LoginExternalAsync(_client, email);
        var token = await GetExternalCsrfTokenAsync(_client);
        var organizationResponse = await CreateExternalOrganizationAsync(_client, token, new
        {
            name = "Organización para decisión institucional", contactEmail = "decision@festival.test",
            coverageLevel = "municipal", departmentCode = "05", municipalityCode = "05001"
        });
        var organization = await organizationResponse.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        Assert.NotNull(organization);
        var festivalResponse = await CreateDraftFestivalAsync(_client, int.Parse(organization!.Id), await GetExternalCsrfTokenAsync(_client), new
        {
            nombre = "Festival con decisión institucional", nivelCobertura = "municipal", codigoDepartamento = "05", codigoMunicipio = "05001"
        });
        var festival = await festivalResponse.Content.ReadFromJsonAsync<FestivalBorradorDto>();
        Assert.NotNull(festival);
        (await SendFestivalToReviewAsync(_client, int.Parse(festival!.Id), await GetExternalCsrfTokenAsync(_client))).EnsureSuccessStatusCode();

        var externalQueue = await _client.GetAsync("/api/v1/institucional/festivales/en-revision");
        Assert.Equal(HttpStatusCode.Unauthorized, externalQueue.StatusCode);

        var institutionalClient = _factory.CreateClient();
        (await institutionalClient.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest { Email = "test@pnmc.local", Password = "pnmc-master" })).EnsureSuccessStatusCode();
        var queue = await institutionalClient.GetFromJsonAsync<List<FestivalRevisionInstitucionalDto>>("/api/v1/institucional/festivales/en-revision");
        Assert.Contains(queue!, item => item.Id == festival.Id);

        var noCsrf = await institutionalClient.PostAsJsonAsync($"/api/v1/institucional/festivales/{festival.Id}/decisiones", new { accion = "SolicitarAjustes", observacion = "Completa la descripción institucional." });
        Assert.Equal(HttpStatusCode.BadRequest, noCsrf.StatusCode);
        var adjustments = await DecideFestivalAsync(institutionalClient, int.Parse(festival.Id), await GetInstitutionalCsrfTokenAsync(institutionalClient), new
        {
            accion = "SolicitarAjustes", observacion = "Completa la descripción institucional."
        });
        adjustments.EnsureSuccessStatusCode();

        var publicBefore = await _client.GetFromJsonAsync<PagedResponse<FestivalDto>>("/api/v1/festivals?limit=100&offset=0");
        Assert.DoesNotContain(publicBefore!.Items, item => item.Name == "Festival con decisión institucional");
        var own = await _client.GetFromJsonAsync<List<FestivalBorradorDto>>($"/api/v1/externo/organizaciones/{organization.Id}/festivales");
        var adjusted = Assert.Single(own!, item => item.Id == festival.Id);
        Assert.Equal("AjustesSolicitados", adjusted.Estado);
        Assert.Contains("Completa", adjusted.ObservacionRevision);

        var updateWithoutCsrf = await _client.PutAsJsonAsync($"/api/v1/externo/festivales/{festival.Id}", new { nombre = "Festival con decisión institucional", nivelCobertura = "municipal", codigoDepartamento = "05", codigoMunicipio = "05001" });
        Assert.Equal(HttpStatusCode.BadRequest, updateWithoutCsrf.StatusCode);
        var update = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/externo/festivales/{festival.Id}")
        {
            Content = JsonContent.Create(new { nombre = "Festival con decisión institucional", descripcion = "Descripción completada.", nivelCobertura = "municipal", codigoDepartamento = "05", codigoMunicipio = "05001" })
        };
        update.Headers.Add("X-CSRF-TOKEN", await GetExternalCsrfTokenAsync(_client));
        (await _client.SendAsync(update)).EnsureSuccessStatusCode();
        (await SendFestivalToReviewAsync(_client, int.Parse(festival.Id), await GetExternalCsrfTokenAsync(_client))).EnsureSuccessStatusCode();

        var missingReason = await DecideFestivalAsync(institutionalClient, int.Parse(festival.Id), await GetInstitutionalCsrfTokenAsync(institutionalClient), new { accion = "Rechazar" });
        Assert.Equal(HttpStatusCode.BadRequest, missingReason.StatusCode);
        var invalidAction = await DecideFestivalAsync(institutionalClient, int.Parse(festival.Id), await GetInstitutionalCsrfTokenAsync(institutionalClient), new { accion = "Aprobar" });
        Assert.Equal(HttpStatusCode.BadRequest, invalidAction.StatusCode);
        var publish = await DecideFestivalAsync(institutionalClient, int.Parse(festival.Id), await GetInstitutionalCsrfTokenAsync(institutionalClient), new { accion = "Publicar" });
        publish.EnsureSuccessStatusCode();
        var publicAfter = await _client.GetFromJsonAsync<PagedResponse<FestivalDto>>("/api/v1/festivals?limit=100&offset=0");
        Assert.Contains(publicAfter!.Items, item => item.Name == "Festival con decisión institucional");

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<PnmcDbContext>();
        Assert.Contains(db.HistorialesRevisionRegistros, item => item.RegistroId == festival.Id && item.Accion == "FestivalAjustesSolicitados" && item.Comentario!.Contains("Completa"));
        Assert.Contains(db.HistorialesRevisionRegistros, item => item.RegistroId == festival.Id && item.Accion == "FestivalPublicado");
        Assert.Contains(db.AuditLogs, item => item.RecordId == festival.Id && item.Action == "FestivalPublicado");
        Assert.Contains(db.Notifications, item => item.RecordId == festival.Id && item.EventType == "FestivalPublicado" && item.RecipientEmail == email);
    }

    [Fact]
    public async Task Institutional_Review_Rejects_Decision_On_A_Festival_Outside_Review()
    {
        await LoginAsWebmasterAsync();
        var token = await GetInstitutionalCsrfTokenAsync(_client);
        var invalid = await DecideFestivalAsync(_client, 1, token, new { accion = "Publicar" });
        Assert.Equal(HttpStatusCode.Conflict, invalid.StatusCode);
    }

    [Fact]
    public async Task Public_Festival_Directory_Exposes_Only_Approved_Fields_And_States()
    {
        FestivalRow publicado;
        FestivalRow borrador;
        FestivalRow enRevision;
        FestivalRow ajustes;
        FestivalRow rechazado;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PnmcDbContext>();
            var organizacion = new EntityProfileRow
            {
                EntityType = "organizacion",
                Name = "Fundación Pública de Prueba",
                IdentificationNumber = $"PUB-{Guid.NewGuid():N}",
                ContactEmail = "privado@organizacion.test",
                CoverageLevel = "municipal",
                DepartmentCode = "05",
                MunicipalityCode = "05001",
                StatusCode = "activo",
                IsActive = true,
                CreatedByUserId = 1,
                CreatedAt = DateTime.UtcNow
            };
            db.EntityProfiles.Add(organizacion);
            db.SaveChanges();

            publicado = new FestivalRow
            {
                Name = "Festival Público CV-008",
                Description = "Descripción estable para consulta pública.",
                OrganizacionPrincipalId = organizacion.Id,
                Periodicidad = "Anual",
                ContactEmail = "contacto@festival-publico.test",
                CoverageLevel = "municipal",
                DepartmentCode = "05",
                MunicipalityCode = "05001",
                StatusCode = "Publicado",
                CreatedAt = DateTime.UtcNow
            };
            borrador = new FestivalRow { Name = "Festival Borrador CV-008", CoverageLevel = "municipal", DepartmentCode = "05", MunicipalityCode = "05001", StatusCode = "Borrador", CreatedAt = DateTime.UtcNow };
            enRevision = new FestivalRow { Name = "Festival En Revisión CV-008", CoverageLevel = "municipal", DepartmentCode = "05", MunicipalityCode = "05001", StatusCode = "EnRevision", CreatedAt = DateTime.UtcNow };
            ajustes = new FestivalRow { Name = "Festival Ajustes CV-008", CoverageLevel = "municipal", DepartmentCode = "05", MunicipalityCode = "05001", StatusCode = "AjustesSolicitados", CreatedAt = DateTime.UtcNow };
            rechazado = new FestivalRow { Name = "Festival Rechazado CV-008", CoverageLevel = "municipal", DepartmentCode = "05", MunicipalityCode = "05001", StatusCode = "Rechazado", CreatedAt = DateTime.UtcNow };
            db.FestivalRecords.AddRange(publicado, borrador, enRevision, ajustes, rechazado);
            db.SaveChanges();
            db.FestivalesPracticasMusicales.Add(new FestivalPracticaMusicalRow { FestivalId = publicado.Id, PracticaMusicalId = 1, FechaCreacion = DateTime.UtcNow });
            db.FestivalesTerritoriosSonoros.Add(new FestivalTerritorioSonoroRow { FestivalId = publicado.Id, TerritorioSonoroId = 1, FechaCreacion = DateTime.UtcNow });
            db.SaveChanges();
        }

        var listResponse = await _client.GetAsync("/api/v1/publico/festivales?limit=100&offset=0");
        listResponse.EnsureSuccessStatusCode();
        var listado = await listResponse.Content.ReadFromJsonAsync<PagedResponse<FestivalPublicoDto>>();
        Assert.NotNull(listado);
        Assert.Contains(listado!.Items, item => item.Id == publicado.Id.ToString());
        Assert.Contains(listado.Items, item => item.Nombre == "Festival Test");
        Assert.DoesNotContain(listado.Items, item => item.Id == borrador.Id.ToString() || item.Id == enRevision.Id.ToString() || item.Id == ajustes.Id.ToString() || item.Id == rechazado.Id.ToString());

        var detailResponse = await _client.GetAsync($"/api/v1/publico/festivales/{publicado.Id}");
        detailResponse.EnsureSuccessStatusCode();
        var detalle = await detailResponse.Content.ReadFromJsonAsync<FestivalPublicoDto>();
        Assert.NotNull(detalle);
        Assert.Equal("Fundación Pública de Prueba", detalle!.OrganizacionResponsable);
        Assert.Equal("Antioquia", detalle.TerritorioPrincipal.Departamento);
        Assert.Equal("Medellin", detalle.TerritorioPrincipal.Municipio);
        Assert.Single(detalle.PracticasMusicales);
        Assert.Single(detalle.TerritoriosSonoros);
        Assert.Equal("contacto@festival-publico.test", detalle.CorreoContacto);
        var body = await detailResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("privado@organizacion.test", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("observacion", body, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("auditoria", body, StringComparison.OrdinalIgnoreCase);

        var hiddenDetail = await _client.GetAsync($"/api/v1/publico/festivales/{borrador.Id}");
        Assert.Equal(HttpStatusCode.NotFound, hiddenDetail.StatusCode);
        var map = await _client.GetFromJsonAsync<DepartmentDrilldownResponseDto>("/api/v1/map/departments/05/drilldown");
        Assert.Contains(map!.Festivals, item => item.Name == "Festival Público CV-008");
        Assert.DoesNotContain(map.Festivals, item => item.Name == "Festival Borrador CV-008" || item.Name == "Festival En Revisión CV-008" || item.Name == "Festival Ajustes CV-008" || item.Name == "Festival Rechazado CV-008");
    }

    [Fact]
    public async Task External_Administrator_Proposes_Changes_Without_Replacing_The_Public_Festival()
    {
        var anonymousClient = _factory.CreateClient();
        var withoutSession = await anonymousClient.PostAsJsonAsync("/api/v1/externo/festivales/1/propuestas-cambio", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, withoutSession.StatusCode);

        const string email = "festival.propuesta@example.com";
        await RegisterAndVerifyExternalPersonAsync(email);
        await LoginExternalAsync(_client, email);
        var organizationResponse = await CreateExternalOrganizationAsync(_client, await GetExternalCsrfTokenAsync(_client), new
        {
            name = "Organización de propuesta Festival", contactEmail = "propuesta@festival.test",
            coverageLevel = "municipal", departmentCode = "05", municipalityCode = "05001"
        });
        organizationResponse.EnsureSuccessStatusCode();
        var organization = await organizationResponse.Content.ReadFromJsonAsync<ExternalOrganizationDto>();
        Assert.NotNull(organization);
        var festivalResponse = await CreateDraftFestivalAsync(_client, int.Parse(organization!.Id), await GetExternalCsrfTokenAsync(_client), new
        {
            nombre = "Festival Música del Río", descripcion = "Festival anual de músicas tradicionales.", periodicidad = "anual",
            correoContacto = "rio@festival.test", nivelCobertura = "municipal", codigoDepartamento = "05", codigoMunicipio = "05001",
            practicasMusicalesIds = new[] { 1 }, territoriosSonorosIds = new[] { 1 }
        });
        festivalResponse.EnsureSuccessStatusCode();
        var festival = await festivalResponse.Content.ReadFromJsonAsync<FestivalBorradorDto>();
        Assert.NotNull(festival);
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<PnmcDbContext>();
            var publicado = db.FestivalRecords.Single(item => item.Id == int.Parse(festival!.Id));
            publicado.StatusCode = "Publicado";
            db.SaveChanges();
        }

        var publicBefore = await _client.GetFromJsonAsync<FestivalPublicoDto>($"/api/v1/publico/festivales/{festival!.Id}");
        Assert.NotNull(publicBefore);
        Assert.Equal("Festival anual de músicas tradicionales.", publicBefore!.Descripcion);
        Assert.Single(publicBefore.PracticasMusicales);
        Assert.Single(publicBefore.TerritoriosSonoros);

        var withoutCsrf = await _client.PostAsJsonAsync($"/api/v1/externo/festivales/{festival.Id}/propuestas-cambio", new { });
        Assert.Equal(HttpStatusCode.BadRequest, withoutCsrf.StatusCode);

        var institutionalClient = _factory.CreateClient();
        (await institutionalClient.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest { Email = "test@pnmc.local", Password = "pnmc-master" })).EnsureSuccessStatusCode();
        var institutionalProposal = await institutionalClient.PostAsJsonAsync($"/api/v1/externo/festivales/{festival.Id}/propuestas-cambio", new { });
        Assert.Equal(HttpStatusCode.Unauthorized, institutionalProposal.StatusCode);

        var otherClient = _factory.CreateClient();
        var otherRegistration = await otherClient.PostAsJsonAsync("/api/v1/external/auth/register", new ExternalRegisterRequest
        {
            ProfileType = "persona", FullName = "Otra administradora", Email = "festival.propuesta.ajena@example.com", Password = "ClaveExterna123", AcceptTerms = true, AcceptDataPolicy = true
        });
        var otherAccount = await otherRegistration.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        await otherClient.PostAsJsonAsync("/api/v1/external/auth/verify-email", new ExternalVerifyEmailRequest { Email = "festival.propuesta.ajena@example.com", Code = otherAccount!.DebugVerificationCode });
        await LoginExternalAsync(otherClient, "festival.propuesta.ajena@example.com");
        var otherProposal = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/externo/festivales/{festival.Id}/propuestas-cambio") { Content = JsonContent.Create(new { }) };
        otherProposal.Headers.Add("X-CSRF-TOKEN", await GetExternalCsrfTokenAsync(otherClient));
        Assert.Equal(HttpStatusCode.Forbidden, (await otherClient.SendAsync(otherProposal)).StatusCode);

        var createProposal = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/externo/festivales/{festival.Id}/propuestas-cambio") { Content = JsonContent.Create(new { }) };
        createProposal.Headers.Add("X-CSRF-TOKEN", await GetExternalCsrfTokenAsync(_client));
        var proposalResponse = await _client.SendAsync(createProposal);
        Assert.True(proposalResponse.StatusCode == HttpStatusCode.Created, await proposalResponse.Content.ReadAsStringAsync());
        var proposal = await proposalResponse.Content.ReadFromJsonAsync<PropuestaCambioFestivalDto>();
        Assert.NotNull(proposal);
        Assert.Equal("Borrador", proposal!.Estado);
        Assert.Equal(festival.Id, proposal.FestivalOrigenId);
        Assert.Single(proposal.PracticasMusicales);
        Assert.Single(proposal.TerritoriosSonoros);

        var repeatProposal = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/externo/festivales/{festival.Id}/propuestas-cambio") { Content = JsonContent.Create(new { }) };
        repeatProposal.Headers.Add("X-CSRF-TOKEN", await GetExternalCsrfTokenAsync(_client));
        var repeated = await _client.SendAsync(repeatProposal);
        Assert.Equal(HttpStatusCode.OK, repeated.StatusCode);
        var existingProposal = await repeated.Content.ReadFromJsonAsync<PropuestaCambioFestivalDto>();
        Assert.Equal(proposal.Id, existingProposal!.Id);

        var directUpdate = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/externo/festivales/{festival.Id}")
        {
            Content = JsonContent.Create(new { nombre = "Cambio directo indebido", nivelCobertura = "nacional" })
        };
        directUpdate.Headers.Add("X-CSRF-TOKEN", await GetExternalCsrfTokenAsync(_client));
        Assert.Equal(HttpStatusCode.Conflict, (await _client.SendAsync(directUpdate)).StatusCode);

        var updateProposal = new HttpRequestMessage(HttpMethod.Put, $"/api/v1/externo/festivales/{festival.Id}/propuesta-cambio")
        {
            Content = JsonContent.Create(new
            {
                nombre = "Festival Nacional Música del Río", descripcion = "Festival nacional de músicas tradicionales y contemporáneas.",
                periodicidad = "bienal", correoContacto = "nuevo@festival.test", nivelCobertura = "nacional",
                practicasMusicalesIds = Array.Empty<int>(), territoriosSonorosIds = Array.Empty<int>()
            })
        };
        updateProposal.Headers.Add("X-CSRF-TOKEN", await GetExternalCsrfTokenAsync(_client));
        var updatedResponse = await _client.SendAsync(updateProposal);
        updatedResponse.EnsureSuccessStatusCode();
        var updatedProposal = await updatedResponse.Content.ReadFromJsonAsync<PropuestaCambioFestivalDto>();
        Assert.Equal("Festival Nacional Música del Río", updatedProposal!.Nombre);
        Assert.Empty(updatedProposal.PracticasMusicales);
        Assert.Empty(updatedProposal.TerritoriosSonoros);

        var publicAfter = await _client.GetFromJsonAsync<FestivalPublicoDto>($"/api/v1/publico/festivales/{festival.Id}");
        Assert.NotNull(publicAfter);
        Assert.Equal("Festival Música del Río", publicAfter!.Nombre);
        Assert.Equal("Festival anual de músicas tradicionales.", publicAfter.Descripcion);
        Assert.Equal("municipal", publicAfter.TerritorioPrincipal.NivelCobertura);
        Assert.Single(publicAfter.PracticasMusicales);
        Assert.Single(publicAfter.TerritoriosSonoros);
        var map = await _client.GetFromJsonAsync<DepartmentDrilldownResponseDto>("/api/v1/map/departments/05/drilldown");
        Assert.Contains(map!.Festivals, item => item.Name == "Festival Música del Río");

        using var verificationScope = _factory.Services.CreateScope();
        var verificationDb = verificationScope.ServiceProvider.GetRequiredService<PnmcDbContext>();
        Assert.Single(verificationDb.VersionesFestival.Where(item => item.FestivalOrigenId == int.Parse(festival.Id) && item.EsVigente));
        Assert.Single(verificationDb.PropuestasCambioFestival.Where(item => item.FestivalOrigenId == int.Parse(festival.Id) && item.Activa));
        Assert.Empty(verificationDb.PropuestasCambioFestivalPracticasMusicales.Where(item => item.PropuestaCambioFestivalId == int.Parse(proposal.Id)));
        Assert.Single(verificationDb.FestivalesPracticasMusicales.Where(item => item.FestivalId == int.Parse(festival.Id)));
        Assert.Contains(verificationDb.AuditLogs, item => item.Action == "FestivalCambioPropuesto" && item.RecordId == proposal.Id);
        Assert.Contains(verificationDb.AuditLogs, item => item.Action == "FestivalCambioPropuestoActualizado" && item.RecordId == proposal.Id);
    }

    [Fact]
    public async Task Admin_Global_User_Rejects_Obsolete_Role()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/users", new AdminUserUpsertRequest
        {
            FullName = "Editor Obsoleto",
            Email = "editor.obsoleto@pnmc.local",
            Role = "editor",
            Password = "ClaveEditor123",
            IsActive = true
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("rol indicado no puede asignarse", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Admin_Global_User_Can_Create_External_Role()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/users", new AdminUserUpsertRequest
        {
            FullName = "Externo Administrado",
            Email = "externo.administrado@pnmc.local",
            Role = "externo",
            Password = "ClaveExterno123",
            IsActive = true
        });

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<AdminAuthResponse>();
        Assert.NotNull(payload);
        Assert.Equal("externo", payload!.User.Role);
    }

    [Fact]
    public async Task Admin_Users_List_Includes_Final_Roles_And_Ally_Scope()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.GetAsync("/api/v1/admin/auth/users");
        response.EnsureSuccessStatusCode();

        var users = await response.Content.ReadFromJsonAsync<List<AdminUserDto>>();
        Assert.NotNull(users);
        Assert.Contains(users!, item => item.Role == "webmaster");
        Assert.Contains(users!, item => item.Role == "gestor_interno");
        Assert.Contains(users!, item => item.Role == "externo");
        Assert.Contains(users!, item => item.Role == "aliado_admin" && item.AllyEntityId == "1");
    }

    [Fact]
    public async Task Webmaster_Can_Change_Ecosystem_Record_Status()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/admin/data/records/festivals/1/status",
            new AdminRecordStatusRequest
            {
                Status = "publicado",
                Comment = "Validación técnica de permisos de webmaster."
            });

        if (!response.IsSuccessStatusCode)
        {
            var errorPayload = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Unexpected status {response.StatusCode}: {errorPayload}");
        }
    }

    [Fact]
    public async Task Admin_Editorial_Resource_Is_Separate_From_Gallery_Albums()
    {
        await LoginAsWebmasterAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/data/editorial/resources", new EditorialResourceUpsertRequest
        {
            Title = "Recurso Editorial Separado",
            Summary = "Resumen editorial de prueba",
            Category = "Investigacion",
            Year = "2026",
            Author = "Equipo PNMC",
            Keywords = ["editorial", "prueba"]
        });
        createResponse.EnsureSuccessStatusCode();

        var editorialResponse = await _client.GetAsync("/api/v1/admin/data/records/editorial?limit=100");
        editorialResponse.EnsureSuccessStatusCode();
        var editorialBody = await editorialResponse.Content.ReadAsStringAsync();
        Assert.Contains("Recurso Editorial Separado", editorialBody);

        var galleryResponse = await _client.GetAsync("/api/v1/admin/data/records/gallery?limit=100");
        galleryResponse.EnsureSuccessStatusCode();
        var galleryBody = await galleryResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Recurso Editorial Separado", galleryBody);
    }

    [Fact]
    public async Task Notifications_Internal_Can_Be_Created_Listed_And_Read()
    {
        await LoginAsWebmasterAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/notifications", new NotificationCreateRequest
        {
            RecipientEmail = "test@pnmc.local",
            EventType = "registro_aprobado",
            Channel = "internal",
            Title = "Registro aprobado",
            Body = "Tu registro fue aprobado por el equipo PNMC.",
            ModuleId = "festivals",
            RecordId = "1"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<NotificationDto>();
        Assert.NotNull(created);
        Assert.Equal("enviada", created!.Status);
        Assert.Equal("internal", created.Channel);

        var listResponse = await _client.GetAsync("/api/v1/notifications");
        listResponse.EnsureSuccessStatusCode();
        var listPayload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<NotificationDto>>();
        Assert.NotNull(listPayload);
        Assert.Contains(listPayload!.Items, item => item.Id == created.Id);

        var readResponse = await _client.PostAsync($"/api/v1/notifications/{created.Id}/read", null);
        readResponse.EnsureSuccessStatusCode();
        var read = await readResponse.Content.ReadFromJsonAsync<NotificationDto>();
        Assert.NotNull(read);
        Assert.Equal("leida", read!.Status);
        Assert.NotNull(read.ReadAt);
    }

    [Fact]
    public async Task Notifications_Reject_Whatsapp_Without_Configured_Provider()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/admin/notifications", new NotificationCreateRequest
        {
            RecipientEmail = "test@pnmc.local",
            EventType = "recordatorio_actualizacion",
            Channel = "whatsapp",
            Title = "Recordatorio",
            Body = "Actualiza tu informacion."
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("WhatsApp", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Ally_Admin_Can_Create_List_And_Deactivate_Entity_User()
    {
        await LoginAsAllyAdminAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/v1/ally/users", new AllyPortalUserCreateRequest
        {
            FullName = "Editor Entidad Test",
            Email = "editor.entidad@pnmc.local",
            Role = "aliado_editor",
            Password = "ClaveAliado123"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<AllyPortalUserDto>();
        Assert.NotNull(created);
        Assert.Equal("aliado_editor", created!.Role);
        Assert.Equal("1", created.AllyEntityId);

        var listResponse = await _client.GetAsync("/api/v1/ally/users");
        listResponse.EnsureSuccessStatusCode();
        var users = await listResponse.Content.ReadFromJsonAsync<List<AllyPortalUserDto>>();
        Assert.NotNull(users);
        Assert.Contains(users!, item => item.Email == "editor.entidad@pnmc.local" && item.AllyEntityId == "1");

        var deactivateResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/ally/users/{created.Id}/status",
            new AllyPortalUserStatusRequest { IsActive = false });
        deactivateResponse.EnsureSuccessStatusCode();

        var deactivated = await deactivateResponse.Content.ReadFromJsonAsync<AllyPortalUserDto>();
        Assert.NotNull(deactivated);
        Assert.False(deactivated!.IsActive);
    }

    [Fact]
    public async Task Ally_Admin_Cannot_Create_Global_Or_Admin_Ally_User()
    {
        await LoginAsAllyAdminAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/ally/users", new AllyPortalUserCreateRequest
        {
            FullName = "Admin No Permitido",
            Email = "admin.no.permitido@pnmc.local",
            Role = "aliado_admin",
            Password = "ClaveAliado123"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("aliado_editor", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Ally_User_Without_Entity_Cannot_Manage_Entity_Users()
    {
        var login = await _client.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = "aliado.sin.entidad@pnmc.local",
            Password = "pnmc-aliado-editor"
        });
        login.EnsureSuccessStatusCode();

        var response = await _client.GetAsync("/api/v1/ally/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Record_Governance_Creates_Link_Duplicate_And_Quality_Items()
    {
        await LoginAsWebmasterAsync();

        var linkResponse = await _client.PostAsJsonAsync("/api/v1/record-link-requests", new RecordLinkRequestCreateRequest
        {
            ModuleId = "festivals",
            RecordId = "1",
            RequestedScope = "responsable",
            Reason = "Solicito revisar la vinculacion con este registro historico.",
            EvidenceText = "Coinciden nombre, municipio y contacto."
        });
        Assert.Equal(HttpStatusCode.Created, linkResponse.StatusCode);

        var link = await linkResponse.Content.ReadFromJsonAsync<RecordLinkRequestDto>();
        Assert.NotNull(link);
        Assert.Equal("pendiente", link!.Status);

        var linkStatusResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/record-link-requests/{link.Id}/status",
            new RecordLinkRequestStatusRequest
            {
                Status = "en_revision",
                Comment = "Solicitud recibida para verificacion interna."
            });
        linkStatusResponse.EnsureSuccessStatusCode();

        var duplicateResponse = await _client.PostAsJsonAsync("/api/v1/admin/duplicates", new RecordDuplicateCandidateCreateRequest
        {
            ModuleId = "festivals",
            SourceRecordId = "1",
            CandidateRecordId = "2",
            SimilarityLevel = "media",
            SimilarityScore = 72.5m,
            EvidenceJson = "{\"name\":\"similar\"}"
        });
        Assert.Equal(HttpStatusCode.Created, duplicateResponse.StatusCode);

        var duplicate = await duplicateResponse.Content.ReadFromJsonAsync<RecordDuplicateCandidateDto>();
        Assert.NotNull(duplicate);
        Assert.Equal("pendiente", duplicate!.Status);

        var qualityResponse = await _client.PostAsJsonAsync("/api/v1/admin/data-quality/flags", new RecordQualityFlagCreateRequest
        {
            ModuleId = "festivals",
            RecordId = "1",
            FlagType = "requiere_actualizacion",
            Severity = "media",
            Detail = "Registro publicado sin actualizacion reciente."
        });
        Assert.Equal(HttpStatusCode.Created, qualityResponse.StatusCode);

        var quality = await qualityResponse.Content.ReadFromJsonAsync<RecordQualityFlagDto>();
        Assert.NotNull(quality);
        Assert.Equal("abierta", quality!.Status);
    }

    [Fact]
    public async Task Participation_ReturnsBadRequest_WhenMissingRequiredFields()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "",
            ActorName = "",
            Email = "not-an-email",
            Phone = "",
            Department = "",
            Municipality = "",
            MusicalFields = "",
            Description = "",
            Contribution = "",
            Consent = false
        };

        var response = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Participation_ReturnsBadRequest_WhenUrlsAreInvalid()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "organization",
            ActorName = "Colectivo Test URL",
            Email = "colectivo.url@example.com",
            Phone = "3000000000",
            Department = "Antioquia",
            Municipality = "Medellin",
            MusicalFields = "Formacion",
            Description = "Registro de prueba",
            Contribution = "Aporte de prueba",
            Website = "ftp://invalid-url",
            FacebookUrl = "notaurl",
            Consent = true
        };

        var response = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Catalog_Module_Endpoints_ReturnPagedPayloads()
    {
        var festivalsResponse = await _client.GetAsync("/api/v1/festivals?limit=10&offset=0");
        festivalsResponse.EnsureSuccessStatusCode();
        var festivalsPayload = await festivalsResponse.Content.ReadFromJsonAsync<PagedResponse<FestivalDto>>();
        Assert.NotNull(festivalsPayload);

        var schoolsResponse = await _client.GetAsync("/api/v1/music-schools?limit=10&offset=0");
        schoolsResponse.EnsureSuccessStatusCode();
        var schoolsPayload = await schoolsResponse.Content.ReadFromJsonAsync<PagedResponse<MusicSchoolDto>>();
        Assert.NotNull(schoolsPayload);

        var marketsResponse = await _client.GetAsync("/api/v1/music-markets?limit=10&offset=0");
        marketsResponse.EnsureSuccessStatusCode();
        var marketsPayload = await marketsResponse.Content.ReadFromJsonAsync<PagedResponse<MusicMarketDto>>();
        Assert.NotNull(marketsPayload);

        var divipolaResponse = await _client.GetAsync("/api/v1/divipola/grouped");
        divipolaResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Map_Topology_Endpoints_ReturnNewTerritorialObjects()
    {
        var topologyResponse = await _client.GetAsync("/api/v1/map/topojson/territories");
        topologyResponse.EnsureSuccessStatusCode();

        await using var topologyStream = await topologyResponse.Content.ReadAsStreamAsync();
        using var topologyDocument = await JsonDocument.ParseAsync(topologyStream);
        Assert.Equal("Topology", topologyDocument.RootElement.GetProperty("type").GetString());

        var objects = topologyDocument.RootElement.GetProperty("objects");
        Assert.True(objects.TryGetProperty("MGN_ADM_DPTO_POLITICO", out var departmentsObject));
        Assert.True(objects.TryGetProperty("MGN_ADM_MPIO_GRAFICO", out var municipalitiesObject));
        Assert.True(departmentsObject.GetProperty("geometries").GetArrayLength() > 0);
        Assert.True(municipalitiesObject.GetProperty("geometries").GetArrayLength() > 0);

        var compatibilityResponse = await _client.GetAsync("/api/v1/map/geojson/departments");
        compatibilityResponse.EnsureSuccessStatusCode();
        await using var compatibilityStream = await compatibilityResponse.Content.ReadAsStreamAsync();
        using var compatibilityDocument = await JsonDocument.ParseAsync(compatibilityStream);
        Assert.Equal("Topology", compatibilityDocument.RootElement.GetProperty("type").GetString());
    }
}
