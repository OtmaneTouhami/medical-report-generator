"use client";

import {useState, useEffect} from "react";
import {cn} from "@/lib/utils";
import {transcribeAudio} from "@/lib/audio-utils";
import {Chat} from "@/components/ui/chat";
import {useChat} from "@/contexts/chat-context";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import {AppSidebar} from "@/components/app-sidebar";

// Define the mapping between suggestion titles and full prompts
const irmPrompts: Record<string, string> = {
    "IRM Cérébrale - Information Complète": 
        "Un homme de 45 ans présente des maux de tête persistants depuis 3 mois, accompagnés de troubles visuels et de nausées matinales. Il a des antécédents d'hypertension artérielle traitée par Amlodipine 5mg. Son examen neurologique révèle un œdème papillaire bilatéral.\n\nL'IRM cérébrale réalisée sur un appareil 3 Tesla avec injection de gadolinium montre une lésion expansive de 3,2 cm de diamètre au niveau du lobe frontal droit. Cette masse présente un signal hétérogène en T1 et T2, avec une prise de contraste annulaire intense. Un œdème périlésionnel important est visible s'étendant sur 4 cm autour de la lésion. Il existe un effet de masse modéré sur les structures médianes avec un déplacement de 6 mm vers la gauche. Les ventricules latéraux sont légèrement dilatés. Le reste du parenchyme cérébral ne montre pas d'anomalie significative.",
    
    "IRM Lombaire - Information Incomplète": 
        "Une patiente consulte pour des lombalgies chroniques avec irradiation dans la jambe droite. Elle décrit des douleurs type sciatique S1 avec des fourmillements du pied droit. Aucun antécédent chirurgical.\n\nL'IRM lombo-sacrée en coupes sagittales et axiales T1 et T2 révèle une discopathie dégénérative étagée. Hernie discale postéro-latérale droite en L5-S1 avec conflit disco-radiculaire sur la racine S1 droite. Pincement discal L4-L5 avec protrusion discale postérieure centrale. Canal rachidien de calibre normal. Pas de spondylolisthésis. Articulaires postérieures discrètement remaniées.",
    
    "IRM Genou - Information Minimale": 
        "Patient avec douleur du genou gauche après sport.\n\nIRM du genou gauche : rupture complète du ligament croisé antérieur. Œdème osseux au niveau du plateau tibial externe et du condyle fémoral externe. Ménisque médial intact, ménisque latéral avec fissure horizontale du corps postérieur.",
    
    "IRM Cardiaque - Information Complète": 
        "Une femme de 52 ans, diabétique de type 2 depuis 8 ans, consulte pour dyspnée d'effort et douleurs thoraciques atypiques. Elle a un IMC de 31 et fume 15 cigarettes par jour depuis 25 ans. ECG montre des ondes Q en dérivations inférieures. Échographie cardiaque évoque une altération de la fonction systolique.\n\nL'IRM cardiaque réalisée à 1,5 Tesla avec injection de gadolinium montre un ventricule gauche dilaté avec une fraction d'éjection estimée à 35%. Hypokinésie de la paroi inférieure et inféro-latérale. Séquences de rehaussement tardif mettent en évidence un rehaussement sous-endocardique étendu de la paroi inférieure évoquant une nécrose myocardique ancienne. Pas d'épanchement péricardique. Ventricule droit de taille normale avec fonction conservée.",
    
    "IRM Hépatique - Données Partielles": 
        "Patient de 67 ans avec élévation des transaminases découverte lors d'un bilan systématique.\n\nIRM abdominale avec injection de produit de contraste hépatocytaire : foie de taille normale avec une lésion de 2,1 cm au segment VII. Cette lésion apparaît hypointense en T1, hyperintense en T2, avec rehaussement artériel intense et washout portal. Pas de fixation du produit de contraste hépatocytaire. Plusieurs autres nodules millimétriques dispersés dans le parenchyme hépatique. Voies biliaires non dilatées. Rate et pancréas normaux.",
    
    "IRM Mammaire - Information Détaillée": 
        "Une femme de 41 ans avec antécédents familiaux de cancer du sein (mère décédée à 48 ans, sœur traitée à 45 ans) présente une masse palpable du sein droit découverte à l'autopalpation. Elle n'a jamais eu d'enfant et prend une contraception orale depuis 15 ans. Mammographie ACR 4.\n\nL'IRM mammaire bilatérale avec injection de gadolinium montre une masse de 1,8 cm au quadrant supéro-externe du sein droit, de contours irréguliers, présentant un rehaussement intense et rapide avec washout. Plusieurs adénopathies suspectes dans le creux axillaire homolatéral. Le sein controlatéral ne montre pas d'anomalie significative hormis quelques zones de rehaussement non spécifique probablement bénignes.",
    
    "IRM Prostate - Données Cliniques Insuffisantes": 
        "Homme avec PSA élevé.\n\nIRM prostatique multiparamétrique : prostate de volume 45 ml. Lésion de 12 mm en zone périphérique postérieure droite, hypointense en T2, avec restriction de diffusion marquée (ADC bas). Rehaussement précoce et intense après injection. Score PI-RADS 5. Pas d'effraction capsulaire visible. Vésicules séminales normales.",
    
    "IRM Épaule - Contexte Traumatique Complet": 
        "Un homme de 35 ans, menuisier, chute de son échafaudage il y a 3 jours avec réception sur l'épaule droite tendue. Il présente une impotence fonctionnelle majeure avec impossibilité d'antépulsion. L'examen clinique retrouve une ecchymose importante et une déformation de l'épaule. Radiographies standards normales.\n\nL'IRM de l'épaule droite révèle une rupture transfixiante du tendon du muscle supra-épineux sur 2,5 cm avec rétraction musculaire modérée. Rupture partielle profonde du tendon infra-épineux. Épanchement articulaire abondant. Œdème osseux du trochiter. Tendon du long biceps en place dans sa gouttière. Labrum supérieur partiellement détaché (lésion SLAP de type II).",
    
    "IRM Rachis Cervical - Information Partielle": 
        "Patiente de 28 ans avec cervicalgies et paresthésies du membre supérieur droit.\n\nIRM cervicale : hernie discale C5-C6 avec compression radiculaire C6 droite. Myélopathie cervicale avec hypersignal T2 intramédullaire en regard. Pas de sténose canalaire significative aux autres étages.",
    
    "IRM Abdominopelvienne - Urgence": 
        "Femme de 23 ans se présentant aux urgences pour douleurs pelviennes aiguës sévères, début brutal il y a 6 heures. Dernières règles il y a 5 semaines. Test de grossesse positif. Échographie pelvienne non concluante à cause de l'obésité de la patiente (IMC 35).\n\nL'IRM pelvienne sans injection montre un utérus augmenté de taille avec épaississement endométrial. Pas de sac gestationnel intra-utérin visible. Épanchement pelvien de moyenne abondance avec signal compatible avec du sang. Ovaire droit augmenté de volume avec une formation kystique de 4 cm à contenu hémorragique. Ovaire gauche d'aspect normal. Ces éléments évoquent une grossesse extra-utérine rompue.",
    
    "IRM Articulaire - Données Manquantes": 
        "Patient avec gonflement du poignet.\n\nIRM poignet droit : ténosynovite des fléchisseurs avec épanchement dans la gaine du fléchisseur radial du carpe. Œdème osseux du scaphoïde. Ligaments scapho-lunaire et lunato-triquétal intacts.",
    
    "IRM Thoracique - Bilan d'Extension Oncologique": 
        "Un homme de 58 ans, tabagique sevré depuis 2 ans (40 paquets-années), avec antécédents de BPCO, consulte pour altération de l'état général avec amaigrissement de 8 kg en 3 mois. Toux chronique avec hémoptysies occasionnelles. Scanner thoracique initial montre une masse pulmonaire droite de 6 cm. Biopsie bronchique confirme un adénocarcinome pulmonaire.\n\nL'IRM thoracique pour bilan d'extension révèle une masse du lobe supérieur droit de 5,8 cm avec extension à la plèvre pariétale et aux côtes adjacentes (7ème et 8ème côtes) avec lyse osseuse. Adénopathies médiastinales bilatérales dont la plus volumineuse mesure 2,3 cm. Nodule pulmonaire controlatéral de 8 mm au lobe inférieur gauche suspect de métastase. Épanchement pleural de faible abondance à droite. Le foie montre deux lésions suspectes de métastases aux segments VI et VIII."
};

export default function ChatDemo() {
    const [input, setInput] = useState("");
    const {
        messages,
        isLoading,
        addMessage,
        fetchReports,
    } = useChat();

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleSubmit = async (event?: { preventDefault?: () => void }) => {
        event?.preventDefault?.();
        const input = document.querySelector("textarea")?.value;
        if (input) {
            await addMessage(input);
            document.querySelector("textarea")!.value = "";
            setInput("");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    const handleAppend = async (message: { type: "user"; content: string }) => {
        // Check if the message content is one of our prompt titles
        const fullPrompt = irmPrompts[message.content] || message.content;
        
        // Send the full prompt to the chat
        await addMessage(fullPrompt);
        setInput("");
    };

    return (
        <div className="[--header-height:calc(theme(spacing.14))]">
            <SidebarProvider className="flex flex-col">
                <SiteHeader />
                <div className="flex flex-1">
                    <AppSidebar />
                    <SidebarInset>
                        <div className="flex flex-1 flex-col gap-4 p-4">
                                <Chat
                                    className="grow"
                                    messages={messages}
                                    handleSubmit={handleSubmit}
                                    input={input}
                                    handleInputChange={handleInputChange}
                                    isGenerating={isLoading}
                                    append={handleAppend}
                                    suggestions={[
                                        "IRM Cérébrale - Information Complète",
                                        "IRM Lombaire - Information Incomplète",
                                        "IRM Genou - Information Minimale",
                                        "IRM Cardiaque - Information Complète",
                                        "IRM Hépatique - Données Partielles",
                                        "IRM Mammaire - Information Détaillée",
                                        "IRM Prostate - Données Cliniques Insuffisantes",
                                        "IRM Épaule - Contexte Traumatique Complet",
                                        "IRM Rachis Cervical - Information Partielle",
                                        "IRM Abdominopelvienne - Urgence",
                                        "IRM Articulaire - Données Manquantes",
                                        "IRM Thoracique - Bilan d'Extension Oncologique"
                                    ]}
                                    transcribeAudio={transcribeAudio}
                                />
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </div>
    );
}
