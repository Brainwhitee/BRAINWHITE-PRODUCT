import { core } from "@acme/core";
import { deep } from "@acme/core/deep";
import { env } from "~/env";
import "~/styles.css";
import React from "react";
export default function Page() { return <div>{core}{deep}{env}</div>; }
