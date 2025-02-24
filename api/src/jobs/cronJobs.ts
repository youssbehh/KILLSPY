   import { PrismaClient } from '@prisma/client';
   import cron from 'node-cron';

   const prisma = new PrismaClient();

   const deleteMarkedUsers = async () => {
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

       const usersToDelete = await prisma.users.findMany({
           where: {
               archived: true,
               deletionDate: {
                   lte: thirtyDaysAgo
               }
           }
       });

       for (const user of usersToDelete) {
           await prisma.users.delete({
               where: { ID_User: user.ID_User }
           });
           console.log(`Utilisateur supprimé : ${user.Username}`);
       }
   };

   // Exécutez la fonction toutes les 24 heures
   cron.schedule('0 0 * * *', deleteMarkedUsers); // Exécute tous les jours à minuit