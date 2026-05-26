package com.project_pfe_srt.project_srt.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.from:no-reply@srt.local}")
    private String fromEmail;

    public void sendPasswordResetCode(String toEmail, String code) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            throw new IllegalStateException("SMTP mail is not configured.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Code de reinitialisation du mot de passe");
        message.setText(buildResetCodeMessage(code));
        mailSender.send(message);
    }

    private String buildResetCodeMessage(String code) {
        return """
                Bonjour,

                Votre code de reinitialisation est : %s

                Ce code expire dans 10 minutes.
                Si vous n'avez pas demande cette reinitialisation, ignorez cet email.
                """.formatted(code);
    }
}
