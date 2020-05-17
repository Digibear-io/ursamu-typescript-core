import db from "./database";
import flags from "./flags";
import { DBObj } from "../types";

export class Attributes {
  /**
   * Get an attribute by name.
   * @param en Enactor DBObj
   * @param tar Target DBObj
   * @param attr The name of the attribute to grab.
   */
  get(en: DBObj, tar: DBObj, attr: string) {
    if (flags.canEdit(en, tar)) {
      return tar.attributes.find(
        (attrib) => attrib.name.toLowerCase() === attr.toLowerCase()
      );
    }
  }

  /**
   * Set an attribute on a DBObj.
   * @param en Enactor DBObj
   * @param tar Target DBObj
   * @param attribute The attribute to set
   * @param value The value to set the attribute.
   */
  async set(en: DBObj, tar: DBObj, attribute: string, value: string = "") {
    const attrSet = new Set(tar.attributes);
    const attr = this.get(en, tar, attribute);
    if (flags.canEdit(en, tar)) {
      if (attr) {
        attr.value = value;
        attr.lastEdit = en._id!;

        // set the attribute, and clear any attrs with empy values.
        tar.attributes.push(attr);
        tar.attributes.filter((attr) => (attr.value ? true : false));
        await db.update({ _id: tar._id }, tar);
      } else {
        // new attribute
        if (value) {
          attrSet.add({
            name: attribute,
            value,
            lastEdit: en._id!,
          });
          tar.attributes = Array.from(attrSet);
          await db.update({ _id: tar._id }, tar);
        }
      }
    }
  }
}

export default new Attributes();
