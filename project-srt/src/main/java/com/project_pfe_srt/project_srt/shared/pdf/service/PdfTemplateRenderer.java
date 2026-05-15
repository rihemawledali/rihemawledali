package com.project_pfe_srt.project_srt.shared.pdf.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Generic HTML → PDF renderer. The only class in the codebase that knows
 * about the openhtmltopdf library — every feature that needs a PDF should
 * depend on this component and provide:
 * <ol>
 *   <li>a classpath template path (e.g. {@code "templates/pdf/facture.html"})</li>
 *   <li>a flat {@code Map<String,String>} of placeholder values</li>
 * </ol>
 *
 * <p>Templates use a zero-magic {@code {{KEY}}} placeholder syntax.
 * Values are HTML-escaped before substitution so callers can safely pass
 * raw user input.</p>
 *
 * <p>Adding a new PDF later = drop a new file under
 * {@code resources/templates/pdf/} and call
 * {@link #render(String, Map)} with its path. No need to touch this class.</p>
 */
@Component
public class PdfTemplateRenderer {

    /**
     * Load {@code templatePath} from the classpath, substitute every
     * {@code {{KEY}}} token by the HTML-escaped value from {@code context}
     * (unknown tokens are left untouched) and render the result to PDF.
     *
     * @throws IllegalStateException when the template is missing or the
     *                               renderer fails.
     */
    public byte[] render(String templatePath, Map<String, String> context) {
        String html = fill(loadTemplate(templatePath), context);
        // Defence in depth: openhtmltopdf parses the document as strict
        // XHTML without loading the XHTML DTDs, so named entities like
        // &nbsp; are rejected. We rewrite the common offender to its
        // numeric form so future templates don't have to remember this.
        html = html.replace("&nbsp;", "&#160;");
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException(
                    "Échec de la génération du PDF (" + templatePath + ") : " + e.getMessage(), e);
        }
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private static String loadTemplate(String path) {
        try (InputStream is = new ClassPathResource(path).getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Template PDF introuvable : " + path, e);
        }
    }

    private static String fill(String template, Map<String, String> ctx) {
        String out = template;
        if (ctx != null) {
            for (Map.Entry<String, String> e : ctx.entrySet()) {
                String token = "{{" + e.getKey() + "}}";
                out = out.replace(token, escape(e.getValue()));
            }
        }
        return out;
    }

    /** Minimal HTML escaping — enough for text interpolation inside a template. */
    static String escape(String v) {
        if (v == null) return "";
        StringBuilder sb = new StringBuilder(v.length() + 8);
        for (int i = 0; i < v.length(); i++) {
            char c = v.charAt(i);
            switch (c) {
                case '&' -> sb.append("&amp;");
                case '<' -> sb.append("&lt;");
                case '>' -> sb.append("&gt;");
                case '"' -> sb.append("&quot;");
                case '\'' -> sb.append("&#39;");
                default -> sb.append(c);
            }
        }
        return sb.toString();
    }
}
