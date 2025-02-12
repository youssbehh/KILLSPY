import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';
import { toISODateTime } from '../utils/NL_UTILS';

export const addRepayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amountPaid, clientTag, loanName, paymentDate } = req.body
    const userId = req.user.id;

    const client = await prisma_client.clients.findFirst({ where : { clientTag }})
    if(!client) return next(new HttpException("Client introuvable!", ErrCodes.CLIENT_NOT_FOUND, statusCodes.NOT_FOUND, null));

    const loan = await prisma_client.loans.findFirst({ where : { loanName }})
    if(!loan) return next(new HttpException("Prêt introuvable!", ErrCodes.LOAN_NOT_FOUND, statusCodes.NOT_FOUND, null));

    const record = await prisma_client.repayments.create({
      data: {
        amountPaid,
        clientId: client.id,
        loanId: loan.id,
        paymentDate: toISODateTime(paymentDate)
      }
    })    
    res.status(200).json({ message : "Remboursement du prêt \"" + loanName + "\" bien créé!" })
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'ajout d'un remboursement", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const myRepayments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await prisma_client.repayments.findMany({
      where: {
        loan: {
          userId: req.user.id
        }
      },
      select: {
        id: true,
        amountPaid: true,
        paymentDate: true,
        loan: {
          select: {
            loanName: true,
            status: true,
          }
        },
        client: {
          select: {
            clientTag: true,
          }
        }
      }
    });
    if(!records) return next(new HttpException("Aucun remboursement trouvé.", ErrCodes.UNAUTHORIZED_ACCESS, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "Remboursements bien trouvés.", records })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération des remboursements.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}