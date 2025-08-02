import { useCallback } from 'react'
import { emailService } from './emailService'
import { useToast } from './useToast'
import type { User, Mission, Billing } from '@/types/database'

export function useEmailNotifications() {
  const { addToast } = useToast()

  // Configuration du SMTP
  const configureSMTP = useCallback((config: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }) => {
    emailService.configureSMTP(config)
    addToast({
      type: 'success',
      title: 'Configuration SMTP',
      message: 'Configuration SMTP mise à jour avec succès'
    })
  }, [addToast])

  // Notification d'assignation de mission
  const sendMissionAssignedEmail = useCallback(async (mission: Mission, technician: User) => {
    try {
      const emailData = {
        technicianName: technician.name,
        missionTitle: mission.title,
        missionDate: new Date(mission.date).toLocaleDateString('fr-FR'),
        missionLocation: mission.location,
        missionDescription: mission.description
      }
      
      const success = await emailService.sendTechnicianAssignedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de notification envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de notification'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email mission assignée:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  // Notification d'acceptation de mission
  const sendMissionAcceptedEmail = useCallback(async (mission: Mission, technician: User) => {
    try {
      const emailData = {
        technicianName: technician.name,
        missionTitle: mission.title,
        missionDate: new Date(mission.date).toLocaleDateString('fr-FR'),
        missionLocation: mission.location
      }
      
      const success = await emailService.sendMissionAcceptedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de confirmation envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de confirmation'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email mission acceptée:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  // Notification de refus de mission
  const sendMissionRejectedEmail = useCallback(async (mission: Mission, technician: User) => {
    try {
      const emailData = {
        technicianName: technician.name,
        missionTitle: mission.title,
        reason: mission.rejection_reason || 'Aucune raison spécifiée'
      }
      
      const success = await emailService.sendMissionRejectedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de notification envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de notification'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email mission refusée:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  // Notification de création de paiement
  const sendPaymentCreatedEmail = useCallback(async (billing: Billing & { missions: Mission }, technician: User) => {
    try {
      const emailData = {
        technicianName: technician.name,
        amount: billing.amount,
        missionTitle: billing.missions.title,
        createdDate: new Date(billing.created_at).toLocaleDateString('fr-FR')
      }
      
      const success = await emailService.sendPaymentCreatedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de notification de paiement envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de notification de paiement'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email paiement créé:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  // Notification de validation de paiement
  const sendPaymentValidatedEmail = useCallback(async (billing: Billing & { missions: Mission }, technician: User) => {
    try {
      const emailData = {
        technicianName: technician.name,
        amount: billing.amount,
        missionTitle: billing.missions.title,
        validatedDate: new Date(billing.validated_at || billing.updated_at).toLocaleDateString('fr-FR')
      }
      
      const success = await emailService.sendPaymentValidatedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de validation de paiement envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de validation de paiement'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email paiement validé:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  // Notification de paiement effectué
  const sendPaymentPaidEmail = useCallback(async (billing: Billing & { missions: Mission }, technician: User) => {
    try {
      const emailData = {
        technicianName: technician.name,
        amount: billing.amount,
        missionTitle: billing.missions.title,
        completedDate: new Date(billing.paid_at || billing.updated_at).toLocaleDateString('fr-FR')
      }
      
      const success = await emailService.sendPaymentCompletedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de confirmation de paiement envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de confirmation de paiement'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email paiement effectué:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  // Notification de mise à jour des disponibilités
  const sendAvailabilityUpdatedEmail = useCallback(async (technician: User, availabilityCount: number) => {
    try {
      const emailData = {
        technicianName: technician.name,
        startDate: new Date().toLocaleDateString('fr-FR'),
        endDate: new Date().toLocaleDateString('fr-FR'),
        type: 'Disponibilité'
      }
      
      const success = await emailService.sendAvailabilityCreatedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de confirmation de disponibilités envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de confirmation de disponibilités'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email disponibilités mises à jour:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  // Notification de création d'indisponibilité
  const sendUnavailabilityCreatedEmail = useCallback(async (technician: User, unavailabilityCount: number) => {
    try {
      const emailData = {
        technicianName: technician.name,
        startDate: new Date().toLocaleDateString('fr-FR'),
        endDate: new Date().toLocaleDateString('fr-FR'),
        reason: 'Indisponibilité'
      }
      
      const success = await emailService.sendUnavailabilityCreatedEmail(technician.email, emailData)
      if (success) {
        addToast({
          type: 'success',
          title: 'Email envoyé',
          message: `Email de confirmation d'indisponibilité envoyé à ${technician.name}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Erreur envoi email',
          message: 'Impossible d\'envoyer l\'email de confirmation d\'indisponibilité'
        })
      }
      return success
    } catch (error) {
      console.error('Erreur envoi email indisponibilité créée:', error)
      addToast({
        type: 'error',
        title: 'Erreur envoi email',
        message: 'Erreur lors de l\'envoi de l\'email'
      })
      return false
    }
  }, [addToast])

  return {
    configureSMTP,
    sendMissionAssignedEmail,
    sendMissionAcceptedEmail,
    sendMissionRejectedEmail,
    sendPaymentCreatedEmail,
    sendPaymentValidatedEmail,
    sendPaymentPaidEmail,
    sendAvailabilityUpdatedEmail,
    sendUnavailabilityCreatedEmail
  }
} 