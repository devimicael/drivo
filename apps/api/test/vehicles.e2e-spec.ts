// E2E da garagem — T038/T039 (AC-05.3, AC-06.1..5, AC-07.1..4, AC-08.2, AC-09.4).
// Requer PostgreSQL real (`drivo_test`, host 5433) com `prisma migrate deploy`.
import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

const ORIGIN = 'http://localhost:3000';
const PASSWORD = 'senha-segura-123';
const RUN_ID = Date.now();
const EMAIL_A = `garagem.a.${RUN_ID}@example.com`;
const EMAIL_B = `garagem.b.${RUN_ID}@example.com`;

interface Jar {
  session: string;
  csrf: string;
}

interface TestUser {
  id: string;
  jar: Jar;
}

interface Vehicle {
  id: string;
  userId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  chassi: string;
  renavam: string | null;
  createdAt: string;
  updatedAt: string;
}

interface VehiclePayload {
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  chassi: string;
  renavam?: string;
  cor?: string;
  cilindrada?: number;
  tipo?: string;
  uf?: string;
  anoFabricacao?: number;
}

let plateSeq = 0;

function nextPlate(): string {
  plateSeq += 1;
  const letter = String.fromCharCode(65 + (plateSeq % 26));
  return `TST${plateSeq % 10}${letter}${Math.floor(plateSeq / 10) % 10}${plateSeq % 10}`;
}

function vehiclePayload(overrides: Partial<VehiclePayload> = {}): VehiclePayload {
  plateSeq += 1;
  return {
    placa: nextPlate(),
    marca: 'Volkswagen',
    modelo: 'Gol',
    ano: 2020,
    chassi: `9BWZZZ377VT${String(100_000 + (plateSeq % 900_000))}`,
    ...overrides,
  };
}

function cookiesFrom(response: request.Response): Record<string, string> {
  const raw = (response.headers["set-cookie"] as unknown as string[] | undefined) ?? [];
  const jar: Record<string, string> = {};

  for (const cookie of raw) {
    const pair = cookie.split(";")[0] ?? "";
    const separator = pair.indexOf("=");
    jar[pair.slice(0, separator)] = pair.slice(separator + 1);
  }

  return jar;
}

function authHeaders(jar: Jar): Record<string, string> {
  return {
    Cookie: `drivo_session=${jar.session}; drivo_csrf=${jar.csrf}`,
    Origin: ORIGIN,
    "X-CSRF-Token": jar.csrf,
  };
}

describe("Vehicles (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userA: TestUser;
  let userB: TestUser;
  let primary: Vehicle;
  let secondary: Vehicle;
  let foreignVehicle: Vehicle;

  async function register(name: string, email: string): Promise<TestUser> {
    const response = await request(app.getHttpServer())
      .post("/auth/register")
      .set("Origin", ORIGIN)
      .send({ name, email, password: PASSWORD })
      .expect(201);

    const cookies = cookiesFrom(response);

    return {
      id: response.body.data.id as string,
      jar: {
        session: cookies.drivo_session ?? "",
        csrf: cookies.drivo_csrf ?? "",
      },
    };
  }

  async function createVehicle(user: TestUser, overrides: Partial<VehiclePayload> = {}): Promise<Vehicle> {
    const response = await request(app.getHttpServer())
      .post("/vehicles")
      .set(authHeaders(user.jar))
      .send(vehiclePayload(overrides))
      .expect(201);

    return response.body as Vehicle;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });

    userA = await register("Ana Souza", EMAIL_A);
    userB = await register("Beto Lima", EMAIL_B);

    primary = await createVehicle(userA, { marca: "Volkswagen", modelo: "Gol", ano: 2020 });
    secondary = await createVehicle(userA, { marca: "Chevrolet", modelo: "Onix", ano: 2021 });
    foreignVehicle = await createVehicle(userB, { marca: "Hyundai", modelo: "HB20", ano: 2019 });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email: { in: [EMAIL_A, EMAIL_B] } } });
    }
    await app?.close();
  });

  it("POST /vehicles 201 normaliza a placa e ignora campos derivados (AC-07.1)", async () => {
    const normalizedPlate = nextPlate();
    const hyphenatedLower = `${normalizedPlate.slice(0, 3).toLowerCase()}-${normalizedPlate.slice(3).toLowerCase()}`;

    const response = await request(app.getHttpServer())
      .post("/vehicles")
      .set(authHeaders(userA.jar))
      .send(
        vehiclePayload({
          placa: hyphenatedLower,
          modelo: "Fusca",
          marca: "Volkswagen",
          renavam: "12345678901",
          cor: "Azul",
        }),
      )
      .expect(201);

    expect(response.body).toMatchObject({
      userId: userA.id,
      placa: normalizedPlate,
      modelo: "Fusca",
      renavam: "12345678901",
      cor: "Azul",
    });
    expect(response.body).not.toHaveProperty("origem");
    expect(response.body).not.toHaveProperty("modeloBusca");
    expect(response.body).not.toHaveProperty("marcaBusca");
  });

  it("POST /vehicles com placa repetida (com hífen) responde 409 (AC-07.3)", async () => {
    const hyphenated = `${primary.placa.slice(0, 3)}-${primary.placa.slice(3)}`;

    const response = await request(app.getHttpServer())
      .post("/vehicles")
      .set(authHeaders(userA.jar))
      .send(vehiclePayload({ placa: hyphenated }))
      .expect(409);

    expect(response.body.error.code).toBe("PLATE_ALREADY_EXISTS");
  });

  it("POST /vehicles inválido responde 400 com details por campo (AC-07.2)", async () => {
    const response = await request(app.getHttpServer())
      .post("/vehicles")
      .set(authHeaders(userA.jar))
      .send({
        placa: "ABC12",
        marca: "",
        modelo: "",
        ano: 1800,
        chassi: "123",
        renavam: "12",
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.map((detail: { path: string }) => detail.path)).toEqual(
      expect.arrayContaining(["placa", "marca", "modelo", "ano", "chassi", "renavam"]),
    );
  });

  it("POST /vehicles recusa userId/origem e chaves desconhecidas (RF16)", async () => {
    const response = await request(app.getHttpServer())
      .post("/vehicles")
      .set(authHeaders(userA.jar))
      .send({ ...vehiclePayload(), userId: userB.id, origem: "MANUAL" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("GET /vehicles lista só os veículos do dono (AC-05.3)", async () => {
    const response = await request(app.getHttpServer())
      .get("/vehicles")
      .set("Cookie", `drivo_session=${userA.jar.session}`)
      .expect(200);

    const ids = (response.body.data as Vehicle[]).map((vehicle) => vehicle.id);

    expect(ids).toEqual(expect.arrayContaining([primary.id, secondary.id]));
    expect(ids).not.toContain(foreignVehicle.id);
    expect(response.body.meta).toEqual({ total: ids.length, search: null });
  });

  it("GET /vehicles?search= encontra a placa com e sem hífen (AC-06.1)", async () => {
    const hyphenated = `${primary.placa.slice(0, 3)}-${primary.placa.slice(3)}`;

    for (const term of [primary.placa, hyphenated]) {
      const response = await request(app.getHttpServer())
        .get(`/vehicles?search=${encodeURIComponent(term)}`)
        .set("Cookie", `drivo_session=${userA.jar.session}`)
        .expect(200);

      expect((response.body.data as Vehicle[]).map((vehicle) => vehicle.id)).toContain(primary.id);
    }
  });

  it("GET /vehicles?search= encontra trecho de modelo sem diferenciar maiúsculas (AC-06.2)", async () => {
    const response = await request(app.getHttpServer())
      .get("/vehicles?search=gol")
      .set("Cookie", `drivo_session=${userA.jar.session}`)
      .expect(200);

    expect((response.body.data as Vehicle[]).map((vehicle) => vehicle.id)).toContain(primary.id);
  });

  it("GET /vehicles?search= compara ano exato de 4 dígitos (AC-06.3)", async () => {
    const response = await request(app.getHttpServer())
      .get("/vehicles?search=2020")
      .set("Cookie", `drivo_session=${userA.jar.session}`)
      .expect(200);

    const ids = (response.body.data as Vehicle[]).map((vehicle) => vehicle.id);

    expect(ids).toContain(primary.id);
    expect(ids).not.toContain(secondary.id);
  });

  it("GET /vehicles?search= sem correspondência responde 200 com lista vazia (AC-06.4)", async () => {
    const response = await request(app.getHttpServer())
      .get("/vehicles?search=zzzz")
      .set("Cookie", `drivo_session=${userA.jar.session}`)
      .expect(200);

    expect(response.body).toEqual({ data: [], meta: { total: 0, search: "zzzz" } });
  });

  it("GET /vehicles/:id devolve o veículo do dono", async () => {
    const response = await request(app.getHttpServer())
      .get(`/vehicles/${primary.id}`)
      .set("Cookie", `drivo_session=${userA.jar.session}`)
      .expect(200);

    expect(response.body).toMatchObject({ id: primary.id, placa: primary.placa });
  });

  it("404 idêntico para id inexistente, de outro usuário ou malformado (T039)", async () => {
    const cookie = `drivo_session=${userA.jar.session}`;

    const foreign = await request(app.getHttpServer())
      .get(`/vehicles/${foreignVehicle.id}`)
      .set("Cookie", cookie)
      .expect(404);

    const missing = await request(app.getHttpServer())
      .get(`/vehicles/${randomUUID()}`)
      .set("Cookie", cookie)
      .expect(404);

    const malformed = await request(app.getHttpServer())
      .get("/vehicles/nao-e-uuid")
      .set("Cookie", cookie)
      .expect(404);

    expect(foreign.body.error.code).toBe("NOT_FOUND");
    expect(missing.body.error.code).toBe(foreign.body.error.code);
    expect(malformed.body.error.code).toBe(foreign.body.error.code);
  });

  it("PATCH /vehicles/:id atualiza apenas o dono (AC-08.1, AC-08.2)", async () => {
    const updated = await request(app.getHttpServer())
      .patch(`/vehicles/${primary.id}`)
      .set(authHeaders(userA.jar))
      .send({ marca: "Fiat" })
      .expect(200);

    expect(updated.body).toMatchObject({ id: primary.id, marca: "Fiat" });

    const foreign = await request(app.getHttpServer())
      .patch(`/vehicles/${foreignVehicle.id}`)
      .set(authHeaders(userA.jar))
      .send({ marca: "Fiat" })
      .expect(404);

    expect(foreign.body.error.code).toBe("NOT_FOUND");
  });

  it("PATCH com placa já usada responde 409 (AC-08.3, P2002)", async () => {
    const response = await request(app.getHttpServer())
      .patch(`/vehicles/${secondary.id}`)
      .set(authHeaders(userA.jar))
      .send({ placa: primary.placa })
      .expect(409);

    expect(response.body.error.code).toBe("PLATE_ALREADY_EXISTS");
  });

  it("DELETE de veículo alheio responde 404; do dono, 204 (AC-09.4)", async () => {
    const foreign = await request(app.getHttpServer())
      .delete(`/vehicles/${foreignVehicle.id}`)
      .set(authHeaders(userA.jar))
      .expect(404);

    expect(foreign.body.error.code).toBe("NOT_FOUND");

    await request(app.getHttpServer())
      .delete(`/vehicles/${secondary.id}`)
      .set(authHeaders(userA.jar))
      .expect(204);

    await request(app.getHttpServer())
      .get(`/vehicles/${secondary.id}`)
      .set("Cookie", `drivo_session=${userA.jar.session}`)
      .expect(404);
  });

  it("GET /vehicles sem sessão responde 401", async () => {
    const response = await request(app.getHttpServer()).get("/vehicles").expect(401);

    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });
});
