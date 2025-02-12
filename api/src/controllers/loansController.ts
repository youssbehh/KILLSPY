import { NextFunction, Request, Response } from 'express'
import { prisma_client } from '..';
import { HttpException, statusCodes, ErrCodes } from '../utils/exceptions';
import { toISODateTime } from '../utils/NL_UTILS';

export const addLoan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { loanName,clientTag, totalAmount, durationMonths, monthlyPayment, interestRate, startedAt, dueDate } = req.body
    const userId = req.user.id;

    const client = await prisma_client.clients.findFirst({ 
      where : { 
        AND: [
          { userId },
          { clientTag }
      ]}
    })
    if(!client) return next(new HttpException("Client introuvable!", ErrCodes.CLIENT_NOT_FOUND, statusCodes.NOT_FOUND, null));

    const record = await prisma_client.loans.create({
      data: {
        loanName,
        clientId : client.id,
        totalAmount,
        durationMonths,
        monthlyPayment,
        interestRate,
        startedAt: toISODateTime(startedAt),
        dueDate: toISODateTime(dueDate),
        userId
      }
    })    
    res.status(200).json({ message : "Prêt \"" + loanName + "\" bien créé!" })
  } catch (e:any) {
    return next(new HttpException("Erreur durant l'ajout d'un prêt", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getLoansByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma_client.loans.findMany({ where : { userId: req.user.id }, include: { client: true }})
    if(!record) return next(new HttpException("Aucun prêt.", ErrCodes.LOAN_NOT_FOUND, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "Prêts bien trouvés.", record })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération du client.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}

export const getLoansByClientTag = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tagClient } = req.params
    if(!tagClient) return next(new HttpException("Aucun client fournit.", ErrCodes.BAD_REQUEST, statusCodes.BAD_REQUEST, null))
    const record = await prisma_client.loans.findMany({
      where: {
        userId: req.user.id,
        client: {
          clientTag: tagClient,
        },
      },
      include: {
        client: true,
      },
    });
    if(!record) return next(new HttpException("Aucun prêt.", ErrCodes.LOAN_NOT_FOUND, statusCodes.NOT_FOUND, null))
    res.status(200).json({ msg: "Prêts concernant "+ tagClient +" bien trouvé.", record })
  } catch(e:any) {
    console.log(e)
    return next(new HttpException("Erreur dans la récupération du client.", ErrCodes.INTERNAL_SERVER_ERROR, statusCodes.INTERNAL_SERVER_ERROR, e ?? null))
  }
}