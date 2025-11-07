/**
 * Seed database with test data
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data (in reverse order of dependencies)
  await prisma.policyAffiliate.deleteMany()
  await prisma.claim.deleteMany()
  await prisma.affiliate.deleteMany()
  await prisma.policy.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.userClient.deleteMany()
  await prisma.client.deleteMany()
  await prisma.insurer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()

  console.log('✓ Cleared existing data')

  // =========================================================================
  // 1. CREATE ROLES
  // =========================================================================

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
    SUPER_ADMIN: roles[0].id,
    CLAIMS_EMPLOYEE: roles[1].id,
    OPERATIONS_EMPLOYEE: roles[2].id,
    ADMIN_EMPLOYEE: roles[3].id,
    AGENT: roles[4].id,
    CLIENT_ADMIN: roles[5].id,
    AFFILIATE: roles[6].id,
  }

  console.log('✓ Created 7 roles')

  // =========================================================================
  // 2. CREATE INSURERS
  // =========================================================================

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

  console.log('✓ Created 3 insurers')

  // =========================================================================
  // 3. CREATE CLIENTS
  // =========================================================================

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'TechCorp S.A.',
        taxId: '20123456789',
        email: 'rrhh@techcorp.com',
        phone: '+51-1-5678901',
        address: 'Av. Javier Prado 123, San Isidro, Lima',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Industrias ABC',
        taxId: '20234567890',
        email: 'admin@industriasabc.com',
        phone: '+51-1-6789012',
        address: 'Av. Argentina 456, Callao',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Comercial XYZ',
        taxId: '20345678901',
        email: 'gerencia@comercialxyz.com',
        phone: '+51-1-7890123',
        address: 'Jr. Cusco 789, Lima',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Servicios Delta',
        taxId: '20456789012',
        email: 'contacto@serviciosdelta.com',
        phone: '+51-1-8901234',
        address: 'Av. La Marina 321, San Miguel, Lima',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Grupo Omega',
        taxId: '20567890123',
        email: 'info@grupoomega.com',
        phone: '+51-1-9012345',
        address: 'Av. Universitaria 654, Los Olivos, Lima',
      },
    }),
  ])

  console.log('✓ Created 5 clients')

  // =========================================================================
  // 4. CREATE BROKER USERS (Your employees)
  // =========================================================================

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

  console.log('✓ Created 5 broker users')

  // =========================================================================
  // 5. CREATE CLIENT ADMIN USERS
  // =========================================================================

  const clientAdmins = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@techcorp.com',
        name: 'Patricia Vega',
        emailVerified: true,
        globalRoleId: roleMap.CLIENT_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@industriasabc.com',
        name: 'Jorge Castillo',
        emailVerified: true,
        globalRoleId: roleMap.CLIENT_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@comercialxyz.com',
        name: 'Sandra Paredes',
        emailVerified: true,
        globalRoleId: roleMap.CLIENT_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@serviciosdelta.com',
        name: 'Miguel Flores',
        emailVerified: true,
        globalRoleId: roleMap.CLIENT_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@grupoomega.com',
        name: 'Laura Díaz',
        emailVerified: true,
        globalRoleId: roleMap.CLIENT_ADMIN,
      },
    }),
  ])

  console.log('✓ Created 5 client admin users')

  // =========================================================================
  // 6. LINK CLIENT ADMINS TO CLIENTS (UserClient)
  // =========================================================================

  await Promise.all([
    // TechCorp admin
    prisma.userClient.create({
      data: { userId: clientAdmins[0].id, clientId: clients[0].id },
    }),
    // ABC admin manages ABC + XYZ (multi-client example)
    prisma.userClient.create({
      data: { userId: clientAdmins[1].id, clientId: clients[1].id },
    }),
    prisma.userClient.create({
      data: { userId: clientAdmins[1].id, clientId: clients[2].id },
    }),
    // XYZ admin (also has access via ABC admin)
    prisma.userClient.create({
      data: { userId: clientAdmins[2].id, clientId: clients[2].id },
    }),
    // Delta admin
    prisma.userClient.create({
      data: { userId: clientAdmins[3].id, clientId: clients[3].id },
    }),
    // Omega admin
    prisma.userClient.create({
      data: { userId: clientAdmins[4].id, clientId: clients[4].id },
    }),
  ])

  console.log('✓ Linked client admins to clients')

  // =========================================================================
  // 7. CREATE POLICIES
  // =========================================================================

  const policies = await Promise.all([
    // TechCorp - Health (MAPFRE)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-TECH-001',
        clientId: clients[0].id,
        insurerId: insurers[0].id,
        type: 'Salud',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        ambCopay: 20,
        hospCopay: 50,
        maternity: 500,
        tPremium: 150,
        tplus1Premium: 250,
        tplusfPremium: 400,
        taxRate: 18,
        additionalCosts: 25,
      },
    }),
    // TechCorp - Dental (SURA)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-TECH-002',
        clientId: clients[0].id,
        insurerId: insurers[1].id,
        type: 'Dental',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        tPremium: 50,
        tplus1Premium: 80,
        tplusfPremium: 120,
        taxRate: 18,
      },
    }),
    // ABC - Health (SURA)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-ABC-001',
        clientId: clients[1].id,
        insurerId: insurers[1].id,
        type: 'Salud',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        ambCopay: 15,
        hospCopay: 40,
        maternity: 600,
        tPremium: 140,
        tplus1Premium: 240,
        tplusfPremium: 380,
        taxRate: 18,
        additionalCosts: 20,
      },
    }),
    // ABC - Dental (ASIS)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-ABC-002',
        clientId: clients[1].id,
        insurerId: insurers[2].id,
        type: 'Dental',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        tPremium: 45,
        tplus1Premium: 75,
        tplusfPremium: 110,
        taxRate: 18,
      },
    }),
    // XYZ - Health (MAPFRE)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-XYZ-001',
        clientId: clients[2].id,
        insurerId: insurers[0].id,
        type: 'Salud',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        ambCopay: 25,
        hospCopay: 60,
        maternity: 550,
        tPremium: 160,
        tplus1Premium: 260,
        tplusfPremium: 420,
        taxRate: 18,
        additionalCosts: 30,
      },
    }),
    // XYZ - Dental (SURA)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-XYZ-002',
        clientId: clients[2].id,
        insurerId: insurers[1].id,
        type: 'Dental',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        tPremium: 55,
        tplus1Premium: 85,
        tplusfPremium: 130,
        taxRate: 18,
      },
    }),
    // Delta - Health (ASIS)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-DELTA-001',
        clientId: clients[3].id,
        insurerId: insurers[2].id,
        type: 'Salud',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        ambCopay: 18,
        hospCopay: 45,
        maternity: 580,
        tPremium: 145,
        tplus1Premium: 245,
        tplusfPremium: 390,
        taxRate: 18,
        additionalCosts: 22,
      },
    }),
    // Delta - Dental (MAPFRE)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-DELTA-002',
        clientId: clients[3].id,
        insurerId: insurers[0].id,
        type: 'Dental',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        tPremium: 48,
        tplus1Premium: 78,
        tplusfPremium: 115,
        taxRate: 18,
      },
    }),
    // Omega - Health (MAPFRE)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-OMEGA-001',
        clientId: clients[4].id,
        insurerId: insurers[0].id,
        type: 'Salud',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        ambCopay: 22,
        hospCopay: 55,
        maternity: 520,
        tPremium: 155,
        tplus1Premium: 255,
        tplusfPremium: 410,
        taxRate: 18,
        additionalCosts: 28,
      },
    }),
    // Omega - Dental (SURA)
    prisma.policy.create({
      data: {
        policyNumber: 'POL-OMEGA-002',
        clientId: clients[4].id,
        insurerId: insurers[1].id,
        type: 'Dental',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        tPremium: 52,
        tplus1Premium: 82,
        tplusfPremium: 125,
        taxRate: 18,
      },
    }),
  ])

  console.log('✓ Created 10 policies (2 per client)')

  // =========================================================================
  // 8. CREATE AFFILIATES (Owners + Dependents)
  // =========================================================================

  // TechCorp affiliates (2 owners + 1 dependent)
  const techOwner1 = await prisma.affiliate.create({
    data: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan.perez@techcorp.com',
      phone: '+51-987654321',
      dateOfBirth: new Date('1985-03-15'),
      documentType: 'DNI',
      documentNumber: '12345678',
      affiliateType: 'OWNER',
      coverageType: 'TPLUSF',
      clientId: clients[0].id,
    },
  })

  const techDependent1 = await prisma.affiliate.create({
    data: {
      firstName: 'Sofia',
      lastName: 'Pérez',
      email: 'juan.perez@techcorp.com',
      dateOfBirth: new Date('2015-06-20'),
      documentType: 'DNI',
      documentNumber: '87654321',
      affiliateType: 'DEPENDENT',
      primaryAffiliateId: techOwner1.id,
      clientId: clients[0].id,
    },
  })

  const techOwner2 = await prisma.affiliate.create({
    data: {
      firstName: 'Carmen',
      lastName: 'López',
      email: 'carmen.lopez@techcorp.com',
      phone: '+51-987654322',
      dateOfBirth: new Date('1990-08-10'),
      documentType: 'DNI',
      documentNumber: '23456789',
      affiliateType: 'OWNER',
      coverageType: 'T',
      clientId: clients[0].id,
    },
  })

  // ABC affiliates (2 owners + 2 dependents)
  const abcOwner1 = await prisma.affiliate.create({
    data: {
      firstName: 'Pedro',
      lastName: 'Ramírez',
      email: 'pedro.ramirez@industriasabc.com',
      phone: '+51-987654323',
      dateOfBirth: new Date('1988-11-25'),
      documentType: 'DNI',
      documentNumber: '34567890',
      affiliateType: 'OWNER',
      coverageType: 'TPLUS1',
      clientId: clients[1].id,
    },
  })

  const abcDependent1 = await prisma.affiliate.create({
    data: {
      firstName: 'María',
      lastName: 'Ramírez',
      email: 'pedro.ramirez@industriasabc.com',
      dateOfBirth: new Date('1990-02-14'),
      documentType: 'DNI',
      documentNumber: '45678901',
      affiliateType: 'DEPENDENT',
      primaryAffiliateId: abcOwner1.id,
      clientId: clients[1].id,
    },
  })

  const abcOwner2 = await prisma.affiliate.create({
    data: {
      firstName: 'Rosa',
      lastName: 'Fernández',
      email: 'rosa.fernandez@industriasabc.com',
      phone: '+51-987654324',
      dateOfBirth: new Date('1992-04-30'),
      documentType: 'DNI',
      documentNumber: '56789012',
      affiliateType: 'OWNER',
      coverageType: 'TPLUSF',
      clientId: clients[1].id,
    },
  })

  const abcDependent2 = await prisma.affiliate.create({
    data: {
      firstName: 'Carlos',
      lastName: 'Fernández',
      email: 'rosa.fernandez@industriasabc.com',
      dateOfBirth: new Date('2018-09-12'),
      documentType: 'DNI',
      documentNumber: '67890123',
      affiliateType: 'DEPENDENT',
      primaryAffiliateId: abcOwner2.id,
      clientId: clients[1].id,
    },
  })

  // XYZ affiliates (3 owners + 1 dependent)
  const xyzOwner1 = await prisma.affiliate.create({
    data: {
      firstName: 'Alberto',
      lastName: 'Sánchez',
      email: 'alberto.sanchez@comercialxyz.com',
      phone: '+51-987654325',
      dateOfBirth: new Date('1987-07-18'),
      documentType: 'DNI',
      documentNumber: '78901234',
      affiliateType: 'OWNER',
      coverageType: 'T',
      clientId: clients[2].id,
    },
  })

  const xyzOwner2 = await prisma.affiliate.create({
    data: {
      firstName: 'Lucía',
      lastName: 'Morales',
      email: 'lucia.morales@comercialxyz.com',
      phone: '+51-987654326',
      dateOfBirth: new Date('1991-12-05'),
      documentType: 'DNI',
      documentNumber: '89012345',
      affiliateType: 'OWNER',
      coverageType: 'TPLUS1',
      clientId: clients[2].id,
    },
  })

  const xyzDependent1 = await prisma.affiliate.create({
    data: {
      firstName: 'Diego',
      lastName: 'Morales',
      email: 'lucia.morales@comercialxyz.com',
      dateOfBirth: new Date('2020-03-22'),
      documentType: 'DNI',
      documentNumber: '90123456',
      affiliateType: 'DEPENDENT',
      primaryAffiliateId: xyzOwner2.id,
      clientId: clients[2].id,
    },
  })

  const xyzOwner3 = await prisma.affiliate.create({
    data: {
      firstName: 'Fernando',
      lastName: 'Gutiérrez',
      email: 'fernando.gutierrez@comercialxyz.com',
      phone: '+51-987654327',
      dateOfBirth: new Date('1986-05-28'),
      documentType: 'DNI',
      documentNumber: '01234567',
      affiliateType: 'OWNER',
      coverageType: 'T',
      clientId: clients[2].id,
    },
  })

  // Delta affiliates (2 owners + 1 dependent)
  const deltaOwner1 = await prisma.affiliate.create({
    data: {
      firstName: 'Elena',
      lastName: 'Vargas',
      email: 'elena.vargas@serviciosdelta.com',
      phone: '+51-987654328',
      dateOfBirth: new Date('1989-09-14'),
      documentType: 'DNI',
      documentNumber: '11223344',
      affiliateType: 'OWNER',
      coverageType: 'TPLUS1',
      clientId: clients[3].id,
    },
  })

  const deltaDependent1 = await prisma.affiliate.create({
    data: {
      firstName: 'Andrés',
      lastName: 'Vargas',
      email: 'elena.vargas@serviciosdelta.com',
      dateOfBirth: new Date('2019-11-08'),
      documentType: 'DNI',
      documentNumber: '22334455',
      affiliateType: 'DEPENDENT',
      primaryAffiliateId: deltaOwner1.id,
      clientId: clients[3].id,
    },
  })

  const deltaOwner2 = await prisma.affiliate.create({
    data: {
      firstName: 'Ricardo',
      lastName: 'Navarro',
      email: 'ricardo.navarro@serviciosdelta.com',
      phone: '+51-987654329',
      dateOfBirth: new Date('1993-01-20'),
      documentType: 'DNI',
      documentNumber: '33445566',
      affiliateType: 'OWNER',
      coverageType: 'T',
      clientId: clients[3].id,
    },
  })

  // Omega affiliates (2 owners + 2 dependents)
  const omegaOwner1 = await prisma.affiliate.create({
    data: {
      firstName: 'Gabriela',
      lastName: 'Cruz',
      email: 'gabriela.cruz@grupoomega.com',
      phone: '+51-987654330',
      dateOfBirth: new Date('1984-10-12'),
      documentType: 'DNI',
      documentNumber: '44556677',
      affiliateType: 'OWNER',
      coverageType: 'TPLUSF',
      clientId: clients[4].id,
    },
  })

  const omegaDependent1 = await prisma.affiliate.create({
    data: {
      firstName: 'Isabella',
      lastName: 'Cruz',
      email: 'gabriela.cruz@grupoomega.com',
      dateOfBirth: new Date('2016-07-19'),
      documentType: 'DNI',
      documentNumber: '55667788',
      affiliateType: 'DEPENDENT',
      primaryAffiliateId: omegaOwner1.id,
      clientId: clients[4].id,
    },
  })

  const omegaOwner2 = await prisma.affiliate.create({
    data: {
      firstName: 'Daniela',
      lastName: 'Rojas',
      email: 'daniela.rojas@grupoomega.com',
      phone: '+51-987654331',
      dateOfBirth: new Date('1991-06-03'),
      documentType: 'DNI',
      documentNumber: '66778899',
      affiliateType: 'OWNER',
      coverageType: 'TPLUS1',
      clientId: clients[4].id,
    },
  })

  const omegaDependent2 = await prisma.affiliate.create({
    data: {
      firstName: 'Mateo',
      lastName: 'Rojas',
      email: 'daniela.rojas@grupoomega.com',
      dateOfBirth: new Date('2021-02-28'),
      documentType: 'DNI',
      documentNumber: '77889900',
      affiliateType: 'DEPENDENT',
      primaryAffiliateId: omegaOwner2.id,
      clientId: clients[4].id,
    },
  })

  console.log('✓ Created 15 affiliates (11 owners + 4 dependents)')

  // =========================================================================
  // 9. CREATE AFFILIATE USERS (Give some affiliates app access)
  // =========================================================================

  const affiliateUsers = await Promise.all([
    // Juan Pérez from TechCorp gets app access
    prisma.user.create({
      data: {
        email: 'juan.perez.app@techcorp.com',
        name: 'Juan Pérez',
        emailVerified: true,
        globalRoleId: roleMap.AFFILIATE,
      },
    }),
    // Elena Vargas from Delta gets app access
    prisma.user.create({
      data: {
        email: 'elena.vargas.app@serviciosdelta.com',
        name: 'Elena Vargas',
        emailVerified: true,
        globalRoleId: roleMap.AFFILIATE,
      },
    }),
  ])

  // Link users to affiliates
  await Promise.all([
    prisma.affiliate.update({
      where: { id: techOwner1.id },
      data: { userId: affiliateUsers[0].id },
    }),
    prisma.affiliate.update({
      where: { id: deltaOwner1.id },
      data: { userId: affiliateUsers[1].id },
    }),
  ])

  console.log('✓ Created 2 affiliate users with app access')

  // =========================================================================
  // 10. LINK AFFILIATES TO POLICIES (PolicyAffiliate)
  // =========================================================================

  await Promise.all([
    // TechCorp - Link all affiliates to health policy
    prisma.policyAffiliate.create({
      data: { policyId: policies[0].id, affiliateId: techOwner1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[0].id, affiliateId: techDependent1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[0].id, affiliateId: techOwner2.id },
    }),
    // TechCorp - Link owners to dental policy
    prisma.policyAffiliate.create({
      data: { policyId: policies[1].id, affiliateId: techOwner1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[1].id, affiliateId: techOwner2.id },
    }),

    // ABC - Link all to health
    prisma.policyAffiliate.create({
      data: { policyId: policies[2].id, affiliateId: abcOwner1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[2].id, affiliateId: abcDependent1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[2].id, affiliateId: abcOwner2.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[2].id, affiliateId: abcDependent2.id },
    }),

    // XYZ - Link all to health
    prisma.policyAffiliate.create({
      data: { policyId: policies[4].id, affiliateId: xyzOwner1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[4].id, affiliateId: xyzOwner2.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[4].id, affiliateId: xyzDependent1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[4].id, affiliateId: xyzOwner3.id },
    }),

    // Delta - Link all to health
    prisma.policyAffiliate.create({
      data: { policyId: policies[6].id, affiliateId: deltaOwner1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[6].id, affiliateId: deltaDependent1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[6].id, affiliateId: deltaOwner2.id },
    }),

    // Omega - Link all to health
    prisma.policyAffiliate.create({
      data: { policyId: policies[8].id, affiliateId: omegaOwner1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[8].id, affiliateId: omegaDependent1.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[8].id, affiliateId: omegaOwner2.id },
    }),
    prisma.policyAffiliate.create({
      data: { policyId: policies[8].id, affiliateId: omegaDependent2.id },
    }),
  ])

  console.log('✓ Linked affiliates to policies')

  // =========================================================================
  // 11. CREATE EMPLOYEES
  // =========================================================================

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
        userId: brokerUsers[1].id,
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

  console.log('✓ Created 2 employees')

  // =========================================================================
  // 12. CREATE AGENTS
  // =========================================================================

  await Promise.all([
    // Agent with portal access (linked to agent user)
    prisma.agent.create({
      data: {
        firstName: 'Roberto',
        lastName: 'Silva',
        email: 'agent@partneragency.com',
        phone: '+51-987654360',
        agentCode: 'AGT001',
        userId: brokerUsers[4].id,
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

  console.log('✓ Created 2 agents')

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log('  - 7 Roles')
  console.log('  - 3 Insurers')
  console.log('  - 5 Clients')
  console.log('  - 12 Users (5 broker + 5 client admins + 2 affiliates)')
  console.log('  - 15 Affiliates (11 owners + 4 dependents)')
  console.log('  - 10 Policies')
  console.log('  - 19 PolicyAffiliate links')
  console.log('  - 2 Employees')
  console.log('  - 2 Agents')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
