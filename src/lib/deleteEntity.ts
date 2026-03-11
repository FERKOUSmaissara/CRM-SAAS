import { supabase } from "@/lib/supabase";

/**
 * Nom de l'événement personnalisé dispatché après chaque suppression.
 * Les composants peuvent écouter cet événement pour rafraîchir leur état
 * sans avoir à se passer des props ou d'un contexte global.
 *
 * Exemple d'écoute : window.addEventListener(CRM_ENTITY_DELETED_EVENT, handler)
 */
export const CRM_ENTITY_DELETED_EVENT = "crm:entity-deleted";

/**
 * Supprime un enregistrement dans la table Supabase indiquée.
 *
 * La suppression est soumise aux politiques RLS : seul le propriétaire
 * (owner_id = auth.uid()) ou un administrateur peut supprimer un enregistrement.
 *
 * Après une suppression réussie, un événement DOM est émis pour permettre
 * à d'autres composants de se mettre à jour automatiquement.
 *
 * @param table - Nom de la table Supabase (ex : "contacts", "companies")
 * @param id    - UUID de l'enregistrement à supprimer
 * @throws {PostgrestError} si la suppression échoue (permissions, contrainte FK, etc.)
 */
export const deleteEntity = async (table: string, id: string) => {
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }

  // Notification DOM : permet aux composants d'écouter les suppressions
  // sans couplage direct (ex. rafraîchir une liste après suppression).
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CRM_ENTITY_DELETED_EVENT, { detail: { table, id } }));
  }
};
