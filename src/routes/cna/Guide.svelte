<script lang="ts">
  import Link from '@lucide/svelte/icons/link';
  import ToolIcon from '#lib/components/ToolIcon.svelte';
</script>

<section>
  <h2>How to get a CVE for a vulnerability</h2>
  <p>
    A CVE ID can only come from a CVE Numbering Authority (CNA), and each one only covers what's in
    its scope. So the question is never "who gives out CVEs", it's "whose scope is this in". Work
    down this list and stop at the first one that fits.
  </p>
  <ol class="steps">
    <li>
      <b>The vendor or project itself</b>
      Search for it above. If it's a CNA, report the bug to them through their disclosure policy and they'll
      assign the CVE when they publish.
    </li>
    <li>
      <b>A CNA whose scope covers the product</b>
      Plenty of CNAs cover other people's software, like WordPress plugins (Wordfence, Patchstack, WPScan)
      or open source ecosystems. Search for the product type, not just the vendor.
    </li>
    <li>
      <b>GitHub, for projects hosted there</b>
      If the maintainers can open a draft security advisory, they can request a CVE from GitHub in one
      click. As a researcher you can suggest it through private vulnerability reporting.
    </li>
    <li>
      <b>The root or CNA of last resort</b>
      Nobody else fits? MITRE handles most things via
      <a href="https://cveform.mitre.org/" target="_blank" rel="external">the CVE request form</a>,
      and CISA covers industrial control systems and medical devices. Filter by "Last resort" above
      to see them.
    </li>
  </ol>
  <p>
    Ask one CNA at a time. Requesting from two at once is how a bug ends up with two IDs, and one of
    them gets rejected as a duplicate later.
  </p>
</section>

<section>
  <h2>What a CVE request needs</h2>
  <ul class="icons">
    <li>
      <ToolIcon id="versions" />
      <span
        >The product, vendor and affected versions. The <a href="/versions">versions builder</a> helps.</span
      >
    </li>
    <li>
      <ToolIcon id="cwe" />
      <span>The weakness type, ideally as a CWE. Try the <a href="/cwe">CWE explorer</a>.</span>
    </li>
    <li>
      <ToolIcon id="cvss" />
      <span
        >What an attacker gets out of it, and what they need first. The <a href="/cvss"
          >CVSS calculator</a
        > covers both.</span
      >
    </li>
    <li>
      <Link size={20} strokeWidth={1.75} />
      <span>A public reference once there is one: an advisory, a fix commit or a release note.</span
      >
    </li>
  </ul>
</section>

<section>
  <h2>Roles you'll see in the list</h2>
  <dl>
    <dt>CNA</dt>
    <dd>Assigns CVEs within its own scope, usually its own products.</dd>
    <dt>Root</dt>
    <dd>Looks after a group of CNAs (by country or sector) and handles disputes in that area.</dd>
    <dt>Last resort</dt>
    <dd>Assigns for anything in its area that no other CNA covers.</dd>
  </dl>
  <p>
    The data comes straight from the
    <a href="https://www.cve.org/PartnerInformation/ListofPartners" target="_blank" rel="external"
      >CVE Program's partner list</a
    >, fetched fresh every time you open this page.
  </p>
</section>
