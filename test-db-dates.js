const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://neondb_owner:npg_POyT4Fn3RKrt@ep-weathered-pine-aslto6hf-pooler.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true' }); 
prisma.attendance.findMany({ take: 5, orderBy: { date: 'desc' } }).then(res => { console.log(res.map(a => a.date)); prisma.$disconnect(); });
