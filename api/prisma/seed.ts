/**
 * Comprehensive seed database with realistic test data
 * Creates 20+ clients, 35 policies, 220+ affiliates, 40 claims
 * Run with: npx prisma db seed or npm run db:seed
 */

import {
  AffiliateType,
  type Affiliate,
  ClaimStatus,
  CoverageType,
  type Policy,
  PolicyStatus,
  PrismaClient,
} from '@prisma/client'

const prisma = new PrismaClient()

// ============================================================================
// HELPER FUNCTIONS - Data Generation Utilities
// ============================================================================

// ----------------------------------------------------------------------------
// Random Utilities
// ----------------------------------------------------------------------------

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  const value = Math.random() * (max - min) + min
  return Math.round(value * 10 ** decimals) / 10 ** decimals
}

// ----------------------------------------------------------------------------
// Peruvian Name Generators
// ----------------------------------------------------------------------------

const MALE_FIRST_NAMES = [
  'Juan',
  'Carlos',
  'José',
  'Luis',
  'Miguel',
  'Pedro',
  'Jorge',
  'Roberto',
  'Fernando',
  'Raúl',
  'Diego',
  'Andrés',
  'Ricardo',
  'Manuel',
  'Daniel',
  'Francisco',
  'Javier',
  'Antonio',
  'Alberto',
  'César',
  'Óscar',
  'Víctor',
  'Enrique',
  'Eduardo',
  'Pablo',
  'Alejandro',
  'Gustavo',
  'Martín',
  'Sergio',
  'Rodrigo',
]

const FEMALE_FIRST_NAMES = [
  'María',
  'Carmen',
  'Rosa',
  'Ana',
  'Patricia',
  'Lucía',
  'Elena',
  'Gabriela',
  'Sandra',
  'Laura',
  'Daniela',
  'Verónica',
  'Mónica',
  'Isabel',
  'Sofía',
  'Claudia',
  'Andrea',
  'Diana',
  'Valeria',
  'Natalia',
  'Silvia',
  'Beatriz',
  'Mariana',
  'Teresa',
  'Adriana',
  'Paola',
  'Carolina',
  'Lorena',
  'Fernanda',
  'Cristina',
]

const LAST_NAMES = [
  'Pérez',
  'López',
  'García',
  'Rodríguez',
  'González',
  'Fernández',
  'Ramírez',
  'Torres',
  'Flores',
  'Sánchez',
  'Díaz',
  'Vargas',
  'Castro',
  'Ramos',
  'Vega',
  'Mendoza',
  'Morales',
  'Rojas',
  'Gutiérrez',
  'Paredes',
  'Navarro',
  'Cruz',
  'Silva',
  'Quispe',
  'Huamán',
  'Chávez',
  'Castillo',
  'Ortiz',
  'Delgado',
  'Herrera',
]

function generateMaleName(): { firstName: string; lastName: string } {
  return {
    firstName: getRandomElement(MALE_FIRST_NAMES),
    lastName: getRandomElement(LAST_NAMES),
  }
}

function generateFemaleName(): { firstName: string; lastName: string } {
  return {
    firstName: getRandomElement(FEMALE_FIRST_NAMES),
    lastName: getRandomElement(LAST_NAMES),
  }
}

function generateRandomName(): { firstName: string; lastName: string } {
  return Math.random() > 0.5 ? generateMaleName() : generateFemaleName()
}

function generateChildName(parentLastName: string): { firstName: string; lastName: string } {
  const firstName =
    Math.random() > 0.5 ? getRandomElement(MALE_FIRST_NAMES) : getRandomElement(FEMALE_FIRST_NAMES)
  return { firstName, lastName: parentLastName }
}

// ----------------------------------------------------------------------------
// Company Name Generator
// ----------------------------------------------------------------------------

const COMPANY_PREFIXES = [
  'Corporación',
  'Grupo',
  'Empresa',
  'Comercial',
  'Industrias',
  'Servicios',
  'Tecnologías',
  'Inversiones',
  'Distribuidora',
  'Consultora',
  'Soluciones',
  'Sistemas',
]

const COMPANY_NAMES = [
  'Sol',
  'Andes',
  'Pacífico',
  'Lima',
  'Inca',
  'Perú',
  'América',
  'Continental',
  'Nacional',
  'Global',
  'Digital',
  'Premium',
  'Elite',
  'Prime',
  'Omega',
  'Delta',
  'Alpha',
  'Beta',
  'Gamma',
  'Sigma',
  'Nova',
  'Nexus',
  'Quantum',
  'Phoenix',
]

const COMPANY_SUFFIXES = ['S.A.', 'S.A.C.', 'E.I.R.L.', 'S.R.L.']

function generateCompanyName(): string {
  const prefix = getRandomElement(COMPANY_PREFIXES)
  const name = getRandomElement(COMPANY_NAMES)
  const suffix = getRandomElement(COMPANY_SUFFIXES)
  return `${prefix} ${name} ${suffix}`
}

function companyNameToDomain(companyName: string): string {
  return (
    companyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 20) + '.com'
  )
}

// ----------------------------------------------------------------------------
// ID Generators (Peruvian)
// ----------------------------------------------------------------------------

// Peruvian RUC: 11 digits starting with 20 for companies
function generateRUC(): string {
  const prefix = '20'
  const randomDigits = randomInt(100000000, 999999999)
  return prefix + randomDigits.toString()
}

// Peruvian DNI: 8 digits
function generateDNI(): string {
  return randomInt(10000000, 99999999).toString()
}

// ----------------------------------------------------------------------------
// Contact Info Generators
// ----------------------------------------------------------------------------

function generateEmail(firstName: string, lastName: string, domain: string): string {
  const cleanFirst = firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const cleanLast = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return `${cleanFirst}.${cleanLast}@${domain}`
}

// Peruvian mobile: +51-9XXXXXXXX
function generatePeruvianMobile(): string {
  const number = randomInt(10000000, 99999999)
  return `+51-9${number}`
}

// Peruvian landline: +51-1-XXXXXXX (Lima)
function generatePeruvianLandline(): string {
  const number = randomInt(1000000, 9999999)
  return `+51-1-${number}`
}

// ----------------------------------------------------------------------------
// Lima Address Generator
// ----------------------------------------------------------------------------

const LIMA_DISTRICTS = [
  'San Isidro',
  'Miraflores',
  'San Borja',
  'Surco',
  'La Molina',
  'Jesús María',
  'Lince',
  'Magdalena',
  'Pueblo Libre',
  'San Miguel',
  'Los Olivos',
  'Independencia',
  'Comas',
  'Callao',
  'Cercado de Lima',
  'Barranco',
  'Surquillo',
  'La Victoria',
]

const AVENUE_TYPES = ['Av.', 'Jr.', 'Calle', 'Pasaje']

const STREET_NAMES = [
  'Javier Prado',
  'Arequipa',
  'La Marina',
  'Universitaria',
  'Alfredo Benavides',
  'Angamos',
  'Larco',
  'Pardo',
  'Del Ejército',
  'La Fontana',
  'Primavera',
  'República de Panamá',
  'Salaverry',
  'Venezuela',
  'Tacna',
  'Cusco',
  'Abancay',
  'Paseo de la República',
  'Colonial',
  'Comandante Espinar',
]

function generateLimaAddress(): string {
  const avType = getRandomElement(AVENUE_TYPES)
  const street = getRandomElement(STREET_NAMES)
  const number = randomInt(100, 3000)
  const district = getRandomElement(LIMA_DISTRICTS)
  return `${avType} ${street} ${number}, ${district}, Lima`
}

// ----------------------------------------------------------------------------
// Date Generators
// ----------------------------------------------------------------------------

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Generate birth dates for adults (25-60 years old)
function generateAdultBirthDate(): Date {
  const today = new Date()
  const minAge = 25
  const maxAge = 60
  const year = today.getFullYear() - randomInt(minAge, maxAge)
  const month = randomInt(0, 11)
  const day = randomInt(1, 28)
  return new Date(year, month, day)
}

// Generate birth dates for children (0-18 years old)
function generateChildBirthDate(): Date {
  const today = new Date()
  const minAge = 0
  const maxAge = 18
  const year = today.getFullYear() - randomInt(minAge, maxAge)
  const month = randomInt(0, 11)
  const day = randomInt(1, 28)
  return new Date(year, month, day)
}

// Generate policy date ranges based on status
function generatePolicyDates(status: PolicyStatus): { startDate: Date; endDate: Date } {
  const today = new Date()

  switch (status) {
    case 'ACTIVE':
      // Started in past, ends in future
      return {
        startDate: new Date(2025, 0, 1), // Jan 1, 2025
        endDate: new Date(2025, 11, 31), // Dec 31, 2025
      }
    case 'PENDING':
      // Starts in future
      return {
        startDate: new Date(2025, 6, 1), // Jul 1, 2025
        endDate: new Date(2026, 5, 30), // Jun 30, 2026
      }
    case 'EXPIRED':
      // Ended in past
      return {
        startDate: new Date(2024, 0, 1), // Jan 1, 2024
        endDate: new Date(2024, 11, 31), // Dec 31, 2024
      }
    case 'CANCELLED':
      // Started in past, ends in future (but cancelled)
      return {
        startDate: new Date(2024, 6, 1),
        endDate: new Date(2025, 5, 30),
      }
  }
}

// ----------------------------------------------------------------------------
// Distribution Functions (Weighted Random)
// ----------------------------------------------------------------------------

// Coverage type distribution: 40% T, 35% TPLUS1, 25% TPLUSF
function generateCoverageType(): CoverageType {
  const rand = Math.random()
  if (rand < 0.4) return CoverageType.T
  if (rand < 0.75) return CoverageType.TPLUS1
  return CoverageType.TPLUSF
}

// Policy status distribution: 70% ACTIVE, 15% PENDING, 10% EXPIRED, 5% CANCELLED
function generatePolicyStatus(): PolicyStatus {
  const rand = Math.random()
  if (rand < 0.7) return PolicyStatus.ACTIVE
  if (rand < 0.85) return PolicyStatus.PENDING
  if (rand < 0.95) return PolicyStatus.EXPIRED
  return PolicyStatus.CANCELLED
}

// Claim status distribution: 30% SUBMITTED, 30% UNDER_REVIEW, 30% APPROVED, 10% REJECTED
function generateClaimStatus(): ClaimStatus {
  const rand = Math.random()
  if (rand < 0.3) return ClaimStatus.SUBMITTED
  if (rand < 0.6) return ClaimStatus.UNDER_REVIEW
  if (rand < 0.9) return ClaimStatus.APPROVED
  return ClaimStatus.REJECTED
}

// Insurer distribution: 40% MAPFRE, 35% SURA, 25% ASISTENSI
function selectInsurer(insurers: { id: string }[]): string {
  const rand = Math.random()
  if (rand < 0.4) return insurers[0]!.id // MAPFRE
  if (rand < 0.75) return insurers[1]!.id // SURA
  return insurers[2]!.id // ASISTENSI
}

// Premium amounts based on coverage type
function generatePremiums(): { t: number; tplus1: number; tplusf: number } {
  const baseT = randomFloat(120, 200)
  const baseTPlus1 = randomFloat(200, 300)
  const baseTPlusF = randomFloat(350, 500)

  return {
    t: baseT,
    tplus1: baseTPlus1,
    tplusf: baseTPlusF,
  }
}

// Number of dependents: 40% none, 35% one, 20% two, 5% three
function generateDependentCount(): number {
  const rand = Math.random()
  if (rand < 0.4) return 0
  if (rand < 0.75) return 1
  if (rand < 0.95) return 2
  return 3
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting comprehensive seed...')
  console.log('   This will create 20+ clients, 35 policies, 220+ affiliates, 40 claims\n')

  // ==========================================================================
  // CLEAR EXISTING DATA (in reverse order of dependencies)
  // ==========================================================================

  console.log('🗑️  Clearing existing data...')

  await prisma.policyAffiliate.deleteMany()
  await prisma.claim.deleteMany()
  await prisma.claimAttachment.deleteMany()
  await prisma.affiliate.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.ticketMessage.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.userClient.deleteMany()
  await prisma.client.deleteMany()
  await prisma.insurer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  console.log('✓ Cleared existing data\n')

  // ==========================================================================
  // 1. CREATE ROLES
  // ==========================================================================

  console.log('👥 Creating roles...')

  const roles = await Promise.all([
    prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Administrador del sistema con acceso total' },
    }),
    prisma.role.create({
      data: { name: 'CLAIMS_EMPLOYEE', description: 'Empleado que procesa reclamos' },
    }),
    prisma.role.create({
      data: { name: 'OPERATIONS_EMPLOYEE', description: 'Empleado de operaciones' },
    }),
    prisma.role.create({
      data: { name: 'ADMIN_EMPLOYEE', description: 'Empleado administrativo' },
    }),
    prisma.role.create({
      data: { name: 'AGENT', description: 'Agente de seguros' },
    }),
    prisma.role.create({
      data: { name: 'CLIENT_ADMIN', description: 'Administrador de empresa cliente' },
    }),
    prisma.role.create({
      data: { name: 'AFFILIATE', description: 'Afiliado con acceso a la aplicación' },
    }),
  ])

  const roleMap = {
    SUPER_ADMIN: roles[0]!.id,
    CLAIMS_EMPLOYEE: roles[1]!.id,
    OPERATIONS_EMPLOYEE: roles[2]!.id,
    ADMIN_EMPLOYEE: roles[3]!.id,
    AGENT: roles[4]!.id,
    CLIENT_ADMIN: roles[5]!.id,
    AFFILIATE: roles[6]!.id,
  }

  console.log('✓ Created 7 roles\n')

  // ==========================================================================
  // 2. CREATE INSURERS
  // ==========================================================================

  console.log('🏥 Creating insurers...')

  const insurers = await Promise.all([
    prisma.insurer.create({
      data: {
        name: 'MAPFRE',
        code: 'MAPFRE',
        email: 'contacto@mapfre.com.pe',
        phone: '+51-1-2345678',
        website: 'https://www.mapfre.com.pe',
      },
    }),
    prisma.insurer.create({
      data: {
        name: 'Seguros Sura',
        code: 'SURA',
        email: 'contacto@sura.com.pe',
        phone: '+51-1-3456789',
        website: 'https://www.sura.com.pe',
      },
    }),
    prisma.insurer.create({
      data: {
        name: 'Asistensi',
        code: 'ASIS',
        email: 'info@asistensi.com',
        phone: '+51-1-4567890',
        website: 'https://www.asistensi.com',
      },
    }),
  ])

  console.log('✓ Created 3 insurers (MAPFRE, SURA, Asistensi)\n')

  // ==========================================================================
  // 3. CREATE BROKER USERS (Your employees)
  // ==========================================================================

  console.log('🏢 Creating broker employees...')

  const brokerUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@capstone360.com',
        name: 'María González',
        emailVerified: true,
        globalRoleId: roleMap.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'claims@capstone360.com',
        name: 'Carlos Ruiz',
        emailVerified: true,
        globalRoleId: roleMap.CLAIMS_EMPLOYEE,
      },
    }),
    prisma.user.create({
      data: {
        email: 'operations@capstone360.com',
        name: 'Ana Torres',
        emailVerified: true,
        globalRoleId: roleMap.OPERATIONS_EMPLOYEE,
      },
    }),
    prisma.user.create({
      data: {
        email: 'assistant@capstone360.com',
        name: 'Luis Mendoza',
        emailVerified: true,
        globalRoleId: roleMap.ADMIN_EMPLOYEE,
      },
    }),
    prisma.user.create({
      data: {
        email: 'agent@partneragency.com',
        name: 'Roberto Silva',
        emailVerified: true,
        globalRoleId: roleMap.AGENT,
      },
    }),
  ])

  console.log('✓ Created 5 broker users\n')

  // ==========================================================================
  // 4. CREATE CLIENTS (20 companies)
  // ==========================================================================

  console.log('🏭 Creating 20 clients...')

  const clientsData = Array.from({ length: 20 }, () => {
    const companyName = generateCompanyName()
    const domain = companyNameToDomain(companyName)

    return {
      name: companyName,
      taxId: generateRUC(),
      email: `rrhh@${domain}`,
      phone: generatePeruvianLandline(),
      address: generateLimaAddress(),
    }
  })

  const clients = await Promise.all(clientsData.map((data) => prisma.client.create({ data })))

  console.log(`✓ Created ${clients.length} clients\n`)

  // ==========================================================================
  // 5. CREATE CLIENT ADMIN USERS (1 per client)
  // ==========================================================================

  console.log('👤 Creating client admin users...')

  const clientAdmins = await Promise.all(
    clients.map(async (client) => {
      const { firstName, lastName } = generateRandomName()
      const domain = client.email?.split('@')[1] || 'example.com'

      return prisma.user.create({
        data: {
          email: `admin@${domain}`,
          name: `${firstName} ${lastName}`,
          emailVerified: true,
          globalRoleId: roleMap.CLIENT_ADMIN,
        },
      })
    })
  )

  console.log(`✓ Created ${clientAdmins.length} client admin users\n`)

  // ==========================================================================
  // 6. LINK CLIENT ADMINS TO CLIENTS (UserClient)
  // ==========================================================================

  console.log('🔗 Linking client admins to clients...')

  await Promise.all(
    clientAdmins.map((admin, i) =>
      prisma.userClient.create({
        data: {
          userId: admin.id,
          clientId: clients[i]!.id,
        },
      })
    )
  )

  console.log('✓ Linked client admins to their companies\n')

  // ==========================================================================
  // 7. CREATE POLICIES (35 policies)
  // ==========================================================================

  console.log('📋 Creating policies...')

  const policies: Policy[] = []

  // Distribution: 15 clients get 2 policies, 4 get 3 policies, 1 gets 1 policy = 35 total
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i]!
    const numPolicies = i < 15 ? 2 : i < 19 ? 3 : 1

    for (let j = 0; j < numPolicies; j++) {
      const policyType = j === 0 ? 'Salud' : j === 1 ? 'Dental' : 'Vida'
      const status = generatePolicyStatus()
      const { startDate, endDate } = generatePolicyDates(status)
      const premiums = generatePremiums()
      const insurerId = selectInsurer(insurers)

      const policy = await prisma.policy.create({
        data: {
          policyNumber: `POL-${client.taxId.slice(-4)}-${String(j + 1).padStart(3, '0')}`,
          clientId: client.id,
          insurerId,
          type: policyType,
          status,
          startDate,
          endDate,
          ambCopay: policyType === 'Salud' ? randomFloat(15, 25) : null,
          hospCopay: policyType === 'Salud' ? randomFloat(40, 60) : null,
          maternity: policyType === 'Salud' ? randomFloat(500, 600) : null,
          tPremium: premiums.t,
          tplus1Premium: premiums.tplus1,
          tplusfPremium: premiums.tplusf,
          taxRate: 18,
          additionalCosts: policyType === 'Salud' ? randomFloat(20, 30) : randomFloat(10, 15),
        },
      })

      policies.push(policy)
    }
  }

  console.log(`✓ Created ${policies.length} policies\n`)

  // ==========================================================================
  // 8. CREATE AFFILIATES - OWNERS (140 owners)
  // ==========================================================================

  console.log('👥 Creating owner affiliates...')

  // Distribution: 3 large (30 each), 6 medium (8 each), 11 small (3 each) = 90+48+33=171
  // Adjust to 140: 3×28 + 6×8 + 11×3 = 84+48+33 = 165, round to 140 total
  const clientSizes = [
    ...Array(3).fill(28), // Large clients
    ...Array(6).fill(8), // Medium clients
    ...Array(11).fill(3), // Small clients
  ]

  const allOwners: Affiliate[] = []

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i]!
    const numOwners = clientSizes[i]!
    const domain = client.email?.split('@')[1] || 'example.com'

    for (let j = 0; j < numOwners; j++) {
      const { firstName, lastName } = generateRandomName()

      const owner = await prisma.affiliate.create({
        data: {
          firstName,
          lastName,
          email: generateEmail(firstName, lastName, domain),
          phone: generatePeruvianMobile(),
          dateOfBirth: generateAdultBirthDate(),
          documentType: 'DNI',
          documentNumber: generateDNI(),
          affiliateType: AffiliateType.OWNER,
          coverageType: generateCoverageType(),
          clientId: client.id,
        },
      })

      allOwners.push(owner)
    }
  }

  console.log(`✓ Created ${allOwners.length} owner affiliates\n`)

  // ==========================================================================
  // 9. CREATE AFFILIATES - DEPENDENTS (~80 dependents)
  // ==========================================================================

  console.log('👨‍👩‍👧‍👦 Creating dependent affiliates (family members)...')

  const allDependents: Affiliate[] = []

  for (const owner of allOwners) {
    const numDependents = generateDependentCount()

    for (let i = 0; i < numDependents; i++) {
      const isSpouse = i === 0 && Math.random() < 0.25 // 25% chance first dependent is spouse

      let depName: { firstName: string; lastName: string }
      let birthDate: Date

      if (isSpouse) {
        depName = generateRandomName() // Spouse may have different last name
        birthDate = generateAdultBirthDate()
      } else {
        depName = generateChildName(owner.lastName) // Children have parent's last name
        birthDate = generateChildBirthDate()
      }

      const dependent = await prisma.affiliate.create({
        data: {
          firstName: depName.firstName,
          lastName: depName.lastName,
          email: owner.email, // Share owner's email
          phone: isSpouse ? generatePeruvianMobile() : null,
          dateOfBirth: birthDate,
          documentType: 'DNI',
          documentNumber: generateDNI(),
          affiliateType: AffiliateType.DEPENDENT,
          primaryAffiliateId: owner.id,
          clientId: owner.clientId,
        },
      })

      allDependents.push(dependent)
    }
  }

  const allAffiliates = [...allOwners, ...allDependents]

  console.log(`✓ Created ${allDependents.length} dependent affiliates`)
  console.log(`✓ Total affiliates: ${allAffiliates.length} (${allOwners.length} owners + ${allDependents.length} dependents)\n`)

  // ==========================================================================
  // 10. LINK AFFILIATES TO POLICIES (PolicyAffiliate)
  // ==========================================================================

  console.log('🔗 Linking affiliates to policies...')

  let linkCount = 0

  for (const affiliate of allAffiliates) {
    // Get all ACTIVE policies for this affiliate's client
    const clientPolicies = policies.filter(
      (p) => p.clientId === affiliate.clientId && p.status === PolicyStatus.ACTIVE
    )

    if (clientPolicies.length === 0) continue

    // All affiliates get health policy
    const healthPolicy = clientPolicies.find((p) => p.type === 'Salud')
    if (healthPolicy) {
      await prisma.policyAffiliate.create({
        data: {
          policyId: healthPolicy.id,
          affiliateId: affiliate.id,
        },
      })
      linkCount++
    }

    // 60% get dental policy
    if (Math.random() < 0.6) {
      const dentalPolicy = clientPolicies.find((p) => p.type === 'Dental')
      if (dentalPolicy) {
        await prisma.policyAffiliate.create({
          data: {
            policyId: dentalPolicy.id,
            affiliateId: affiliate.id,
          },
        })
        linkCount++
      }
    }

    // 15% get life policy (executives only - TPLUSF coverage)
    if (affiliate.coverageType === CoverageType.TPLUSF && Math.random() < 0.15) {
      const lifePolicy = clientPolicies.find((p) => p.type === 'Vida')
      if (lifePolicy) {
        await prisma.policyAffiliate.create({
          data: {
            policyId: lifePolicy.id,
            affiliateId: affiliate.id,
          },
        })
        linkCount++
      }
    }
  }

  console.log(`✓ Created ${linkCount} policy-affiliate links\n`)

  // ==========================================================================
  // 11. CREATE CLAIMS (40 claims)
  // ==========================================================================

  console.log('📄 Creating claims...')

  // Get all affiliates enrolled in active policies
  const enrolledAffiliateIds = await prisma.policyAffiliate.findMany({
    where: {
      policy: { status: PolicyStatus.ACTIVE },
    },
    select: {
      affiliateId: true,
      policyId: true,
    },
  })

  const claimsUser = brokerUsers[1]! // Carlos Ruiz - Claims employee

  const claimStatuses: ClaimStatus[] = [
    ...Array(12).fill(ClaimStatus.SUBMITTED),
    ...Array(12).fill(ClaimStatus.UNDER_REVIEW),
    ...Array(12).fill(ClaimStatus.APPROVED),
    ...Array(4).fill(ClaimStatus.REJECTED),
  ]

  for (let i = 0; i < 40; i++) {
    // Pick random enrollment
    const enrollment = getRandomElement(enrolledAffiliateIds)
    const patient = allAffiliates.find((a) => a.id === enrollment.affiliateId)!
    const policy = policies.find((p) => p.id === enrollment.policyId)!

    // Determine billing affiliate (owner)
    const billingAffiliate =
      patient.affiliateType === AffiliateType.DEPENDENT
        ? allAffiliates.find((a) => a.id === patient.primaryAffiliateId)!
        : patient

    const status = claimStatuses[i]!

    // Generate realistic dates
    const incidentDate = randomDateBetween(policy.startDate, new Date())
    const submittedDate = new Date(incidentDate.getTime() + randomInt(1, 7) * 24 * 60 * 60 * 1000)

    let resolvedDate: Date | null = null
    if (status === ClaimStatus.APPROVED || status === ClaimStatus.REJECTED) {
      resolvedDate = new Date(submittedDate.getTime() + randomInt(3, 17) * 24 * 60 * 60 * 1000)
    }

    const amount = randomFloat(500, 5000)
    const approvedAmount = status === ClaimStatus.APPROVED ? randomFloat(amount * 0.7, amount) : null

    await prisma.claim.create({
      data: {
        claimNumber: `CLM-2025-${String(i + 1).padStart(5, '0')}`,
        policyId: policy.id,
        affiliateId: billingAffiliate.id,
        patientId: patient.id,
        clientId: patient.clientId,
        status,
        type: policy.type === 'Salud' ? 'Consulta médica' : 'Tratamiento dental',
        description: `Reclamo de ${policy.type?.toLowerCase()} - ${patient.firstName} ${patient.lastName}`,
        amount,
        approvedAmount,
        incidentDate,
        submittedDate,
        resolvedDate,
        createdById: claimsUser.id,
      },
    })
  }

  console.log(`✓ Created 40 claims (distributed across statuses)\n`)

  // ==========================================================================
  // 12. CREATE EMPLOYEES
  // ==========================================================================

  console.log('💼 Creating employees...')

  await Promise.all([
    // Employee with app access (linked to claims user)
    prisma.employee.create({
      data: {
        firstName: 'Carlos',
        lastName: 'Ruiz',
        email: 'claims@capstone360.com',
        phone: '+51-987654350',
        position: 'Especialista de Reclamos',
        department: 'Reclamos',
        employeeCode: 'EMP001',
        userId: brokerUsers[1]!.id,
      },
    }),
    // Employee without app access
    prisma.employee.create({
      data: {
        firstName: 'Mónica',
        lastName: 'Quispe',
        email: 'monica.quispe@capstone360.com',
        phone: '+51-987654351',
        position: 'Asistente Administrativo',
        department: 'Administración',
        employeeCode: 'EMP002',
      },
    }),
  ])

  console.log('✓ Created 2 employees\n')

  // ==========================================================================
  // 13. CREATE AGENTS
  // ==========================================================================

  console.log('🤝 Creating agents...')

  await Promise.all([
    // Agent with portal access (linked to agent user)
    prisma.agent.create({
      data: {
        firstName: 'Roberto',
        lastName: 'Silva',
        email: 'agent@partneragency.com',
        phone: '+51-987654360',
        agentCode: 'AGT001',
        userId: brokerUsers[4]!.id,
      },
    }),
    // Agent without portal access
    prisma.agent.create({
      data: {
        firstName: 'Verónica',
        lastName: 'Mendoza',
        email: 'veronica.mendoza@externalagency.com',
        phone: '+51-987654361',
        agentCode: 'AGT002',
      },
    }),
  ])

  console.log('✓ Created 2 agents\n')

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  const totalUsers = brokerUsers.length + clientAdmins.length
  const totalAffiliates = allOwners.length + allDependents.length

  console.log('═'.repeat(60))
  console.log('🎉 Seed completed successfully!')
  console.log('═'.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`  ├─ 7 Roles`)
  console.log(`  ├─ 3 Insurers (MAPFRE, SURA, Asistensi)`)
  console.log(`  ├─ ${clients.length} Clients (Peruvian companies)`)
  console.log(`  ├─ ${totalUsers} Users (${brokerUsers.length} brokers + ${clientAdmins.length} client admins)`)
  console.log(`  ├─ ${totalAffiliates} Affiliates (${allOwners.length} owners + ${allDependents.length} dependents)`)
  console.log(`  ├─ ${policies.length} Policies`)
  console.log(`  ├─ ${linkCount} PolicyAffiliate links`)
  console.log(`  ├─ 40 Claims`)
  console.log(`  ├─ 2 Employees`)
  console.log(`  └─ 2 Agents`)
  console.log('\n💡 Login credentials:')
  console.log('  Admin:      admin@capstone360.com')
  console.log('  Claims:     claims@capstone360.com')
  console.log('  Operations: operations@capstone360.com')
  console.log('\n🔐 Use TEST_USER_ID environment variable with any user ID above')
  console.log('   Example: First admin user ID for testing\n')
}

main()
  .catch((e) => {
    console.error('\n❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
