import {
  Briefcase,
  Globe,
  Link,
  Settings,
  Shield,
  Tag,
  Users,
} from "lucide-react";
import { Metadata } from "next";

import { ReusableTabs } from "@/components/reusable/GeneralLayout/ReusableTabs";
import ReusableTopBar from "@/components/reusable/GeneralLayout/ReusableTopBar";
import {
  Classifications,
  getClassifications,
} from "@/services/internal-api/assets/get-classifications";

import AssetsClassificationTable from "./components/AssetsClassificationTable";
import { classeColumns } from "./components/TablesColumns/Classes";
import { geographyColumns } from "./components/TablesColumns/Geography";
import { gestaoColumns } from "./components/TablesColumns/Gestao";
import { internalColumns } from "./components/TablesColumns/Internal";
import { onoffColumns } from "./components/TablesColumns/OnOff";
import { pubxpvtColumns } from "./components/TablesColumns/PubXPvt";
import { temaColumns } from "./components/TablesColumns/Tema";

export const metadata: Metadata = {
  title: "Assets",
  description: "Assets",
};

const TABS = {
  CLASSES: "classes",
  GEOGRAPHY: "geography",
  GESTAO: "gestao",
  INTERNAL: "internal",
  ONOFF: "onoff",
  PUBXPVT: "pubxpvt",
  TEMA: "tema",
};

export default async function Page() {
  const [
    classesData,
    geographyData,
    gestaoData,
    internalData,
    onOffData,
    pubXpvtData,
    temaData,
  ] = (await Promise.all([
    getClassifications({ type: "classe" }),
    getClassifications({ type: "geography" }),
    getClassifications({ type: "gestao" }),
    getClassifications({ type: "internal" }),
    getClassifications({ type: "onoff" }),
    getClassifications({ type: "pubxpvt" }),
    getClassifications({ type: "tema" }),
  ]).catch((error) => {
    console.error("Error fetching classifications", error);
    return [[], [], [], [], [], [], []];
  })) as [
    Classifications,
    Classifications,
    Classifications,
    Classifications,
    Classifications,
    Classifications,
    Classifications,
  ];

  const tabsConfig = [
    {
      label: "Classes",
      value: TABS.CLASSES,
      classification: classesData,
      icon: <Briefcase color="#217346" size={20} />,
      content: (
        <AssetsClassificationTable
          data={classesData as Classifications}
          tableColumns={classeColumns}
        />
      ),
    },
    {
      label: "Geography",
      value: TABS.GEOGRAPHY,
      classification: geographyData,
      icon: <Globe color="#2A579A" size={20} />,
      content: (
        <AssetsClassificationTable
          data={geographyData as Classifications}
          tableColumns={geographyColumns}
        />
      ),
    },
    {
      label: "Gestão",
      value: TABS.GESTAO,
      classification: gestaoData,
      icon: <Settings color="#D17C19" size={20} />,
      content: (
        <AssetsClassificationTable
          data={gestaoData as Classifications}
          tableColumns={gestaoColumns}
        />
      ),
    },
    {
      label: "Internal",
      value: TABS.INTERNAL,
      disabled: true,
      classification: internalData,
      icon: <Shield color="#217346" size={20} />,
      content: (
        <AssetsClassificationTable
          data={internalData as Classifications}
          tableColumns={internalColumns}
        />
      ),
    },
    {
      label: "Onshore / Offshore",
      value: TABS.ONOFF,
      classification: onOffData,
      icon: <Link color="#2A579A" size={20} />,
      content: (
        <AssetsClassificationTable
          data={onOffData as Classifications}
          tableColumns={onoffColumns}
        />
      ),
    },
    {
      label: "Public X Private",
      value: TABS.PUBXPVT,
      classification: pubXpvtData,
      icon: <Users color="#D17C19" size={20} />,
      content: (
        <AssetsClassificationTable
          data={pubXpvtData as Classifications}
          tableColumns={pubxpvtColumns}
        />
      ),
    },
    {
      label: "Tema",
      value: TABS.TEMA,
      classification: temaData,
      icon: <Tag color="#217346" size={20} />,
      content: (
        <AssetsClassificationTable
          data={temaData as Classifications}
          tableColumns={temaColumns}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4">
      <ReusableTopBar
        displayTitle="Assets"
        displayText="This is Milestones Asset Classification"
      />
      <ReusableTabs tabsConfig={tabsConfig} parameter_name="selected_tab" />
    </div>
  );
}
