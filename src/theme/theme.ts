import type { ThemeFonts, ThemeMode, ThemePalette, ThemeRadii, ThemeStyle } from '../domain/types';

export const APP_CSS = `
  @keyframes slideUp    {from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes slideDown  {from{transform:translateY(0);opacity:1}to{transform:translateY(120%);opacity:0}}
  @keyframes fadeIn     {from{opacity:0}to{opacity:1}}
  @keyframes slideInR   {from{transform:translateX(52px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes slideInL   {from{transform:translateX(-52px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes popIn      {0%{transform:scale(0.88);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
  @keyframes toastIn    {from{transform:translateX(-50%) translateY(14px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
  @keyframes fabPulse   {0%,100%{box-shadow:0 4px 20px var(--fg)}50%{box-shadow:0 4px 36px var(--fg),0 0 0 8px var(--fr)}}
  @keyframes overlayIn  {from{opacity:0}to{opacity:1}}
  @keyframes shake      {0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
  @keyframes shimmer    {0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes rowIn      {from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
  @keyframes pulse      {0%,100%{opacity:1}50%{opacity:0.4}}
  @keyframes goalFill   {from{width:0}}
  * { -webkit-tap-highlight-color:transparent; box-sizing:border-box }
  ::-webkit-scrollbar{display:none}
  input{box-sizing:border-box}
  .press:active{transform:scale(0.94)!important;transition:transform 0.08s!important}
  .hov{transition:background 0.15s}
`;

export const THEME_TOKENS: Record<ThemeStyle, Record<ThemeMode, ThemePalette>> = {
  minimal:{
    light:{bg:"#F7F6F3",surface:"#FFFFFF",surfaceAlt:"#EFEEEA",surfaceHover:"#F4F3EF",primary:"#1C1C1E",secondary:"#8A8A8E",tertiary:"#DDDDD8",accent:"#1C1C1E",accentSoft:"#EFEEEA",income:"#1A7A4A",incomeChip:"#EAF7EF",incomeIcon:"#1A7A4A",expense:"#C0392B",expenseChip:"#FCECEA",expenseIcon:"#C0392B",border:"rgba(0,0,0,0.07)",divider:"rgba(0,0,0,0.05)",hero:"#1C1C1E",heroText:"#FFFFFF",heroSub:"rgba(255,255,255,0.45)",navBg:"#FFFFFF",navBorder:"rgba(0,0,0,0.07)",tabActive:"#1C1C1E",tabInactive:"#C8C8CE",chip:"#EFEEEA",chipText:"#1C1C1E",chipActive:"#1C1C1E",chipActiveText:"#FFFFFF",barFg:"#1C1C1E",barBg:"#E6E6E2",fabBg:"#1C1C1E",fabText:"#FFFFFF",shadow:"0 2px 16px rgba(0,0,0,0.08)",cardShadow:"0 1px 3px rgba(0,0,0,0.05)",modalOverlay:"rgba(0,0,0,0.32)",inputBg:"#F0EFEB",inputBorder:"rgba(0,0,0,0.1)",positive:"#1A7A4A",negative:"#C0392B",warn:"#D4690F",warnChip:"#FEF3E2",donut:["#1C1C1E","#6B6B70","#AEAEB2","#3A3A3C","#8A8A8E","#C7C7CC"],budgetOk:"#1A7A4A",budgetWarn:"#D4690F",budgetOver:"#C0392B",swipeEdit:"#3B82F6",swipeDel:"#EF4444",goalColor:"#6366F1",shimmer:"linear-gradient(90deg,#F0EFEB 25%,#E8E7E3 50%,#F0EFEB 75%)"},
    dark:{bg:"#111110",surface:"#1C1C1E",surfaceAlt:"#2C2C2E",surfaceHover:"#242424",primary:"#F5F5F0",secondary:"#7A7A80",tertiary:"#3A3A3C",accent:"#F5F5F0",accentSoft:"#2C2C2E",income:"#32D74B",incomeChip:"#1B3A27",incomeIcon:"#32D74B",expense:"#FF6868",expenseChip:"#3A1B1B",expenseIcon:"#FF6868",border:"rgba(255,255,255,0.07)",divider:"rgba(255,255,255,0.05)",hero:"#242424",heroText:"#F5F5F0",heroSub:"rgba(245,245,240,0.4)",navBg:"#1C1C1E",navBorder:"rgba(255,255,255,0.07)",tabActive:"#F5F5F0",tabInactive:"#48484A",chip:"#2C2C2E",chipText:"#F5F5F0",chipActive:"#F5F5F0",chipActiveText:"#111110",barFg:"#F5F5F0",barBg:"#2C2C2E",fabBg:"#F5F5F0",fabText:"#111110",shadow:"0 4px 24px rgba(0,0,0,0.6)",cardShadow:"0 1px 4px rgba(0,0,0,0.4)",modalOverlay:"rgba(0,0,0,0.6)",inputBg:"#2C2C2E",inputBorder:"rgba(255,255,255,0.1)",positive:"#32D74B",negative:"#FF6868",warn:"#FF9F0A",warnChip:"#3A2B0A",donut:["#F5F5F0","#9A9A9E","#5A5A5E","#CECECE","#7A7A80","#3A3A3C"],budgetOk:"#32D74B",budgetWarn:"#FF9F0A",budgetOver:"#FF6868",swipeEdit:"#60A5FA",swipeDel:"#F87171",goalColor:"#818CF8",shimmer:"linear-gradient(90deg,#2C2C2E 25%,#3A3A3C 50%,#2C2C2E 75%)"},
  },
  material:{
    light:{bg:"#FFFBF5",surface:"#FFFFFF",surfaceAlt:"#F4EFF4",surfaceHover:"#EEE9F0",primary:"#21005D",secondary:"#625B71",tertiary:"#CAC4D0",accent:"#6750A4",accentSoft:"#EDE9F6",income:"#1B5E3A",incomeChip:"#E0F4E9",incomeIcon:"#1B5E3A",expense:"#B3261E",expenseChip:"#FCE8E6",expenseIcon:"#B3261E",border:"rgba(103,80,164,0.1)",divider:"rgba(103,80,164,0.07)",hero:"#6750A4",heroText:"#FFFFFF",heroSub:"rgba(255,255,255,0.55)",navBg:"#FFFBF5",navBorder:"rgba(103,80,164,0.1)",tabActive:"#6750A4",tabInactive:"#CAC4D0",chip:"#EDE9F6",chipText:"#6750A4",chipActive:"#6750A4",chipActiveText:"#FFFFFF",barFg:"#6750A4",barBg:"#E6E0E9",fabBg:"#6750A4",fabText:"#FFFFFF",shadow:"0 2px 12px rgba(103,80,164,0.15)",cardShadow:"0 1px 3px rgba(103,80,164,0.08)",modalOverlay:"rgba(21,0,93,0.28)",inputBg:"#F4EFF4",inputBorder:"rgba(103,80,164,0.2)",positive:"#1B5E3A",negative:"#B3261E",warn:"#E65100",warnChip:"#FBE9E7",donut:["#6750A4","#9A82DB","#CCC2DC","#7965AF","#B69DF8","#4A3F7A"],budgetOk:"#1B5E3A",budgetWarn:"#E65100",budgetOver:"#B3261E",swipeEdit:"#3B82F6",swipeDel:"#EF4444",goalColor:"#6750A4",shimmer:"linear-gradient(90deg,#F4EFF4 25%,#EDE8F0 50%,#F4EFF4 75%)"},
    dark:{bg:"#141218",surface:"#1D1B20",surfaceAlt:"#2B2930",surfaceHover:"#252330",primary:"#E6DEFF",secondary:"#CCC2DC",tertiary:"#49454F",accent:"#D0BCFF",accentSoft:"#36324A",income:"#6DCE9A",incomeChip:"#1B3328",incomeIcon:"#6DCE9A",expense:"#F28B82",expenseChip:"#31211F",expenseIcon:"#F28B82",border:"rgba(208,188,255,0.12)",divider:"rgba(208,188,255,0.07)",hero:"#4A4458",heroText:"#E6DEFF",heroSub:"rgba(230,222,255,0.5)",navBg:"#1D1B20",navBorder:"rgba(208,188,255,0.1)",tabActive:"#D0BCFF",tabInactive:"#49454F",chip:"#2B2930",chipText:"#D0BCFF",chipActive:"#D0BCFF",chipActiveText:"#141218",barFg:"#D0BCFF",barBg:"#2B2930",fabBg:"#D0BCFF",fabText:"#141218",shadow:"0 4px 24px rgba(0,0,0,0.7)",cardShadow:"0 1px 6px rgba(0,0,0,0.5)",modalOverlay:"rgba(0,0,0,0.65)",inputBg:"#2B2930",inputBorder:"rgba(208,188,255,0.15)",positive:"#6DCE9A",negative:"#F28B82",warn:"#FFB74D",warnChip:"#2E2010",donut:["#D0BCFF","#9A82DB","#6650A4","#B69DF8","#7965AF","#4A4458"],budgetOk:"#6DCE9A",budgetWarn:"#FFB74D",budgetOver:"#F28B82",swipeEdit:"#60A5FA",swipeDel:"#F87171",goalColor:"#A78BFA",shimmer:"linear-gradient(90deg,#2B2930 25%,#38363E 50%,#2B2930 75%)"},
  }
};

export const RADII: Record<ThemeStyle, ThemeRadii> = {minimal:{card:"14px",chip:"8px",bar:"4px",fab:"14px",modal:"22px",input:"10px",icon:"10px",nav:"0"},material:{card:"28px",chip:"50px",bar:"8px",fab:"20px",modal:"32px",input:"14px",icon:"16px",nav:"28px 28px 0 0"}};
export const FONTS: Record<ThemeStyle, ThemeFonts> = {minimal:{display:"'DM Serif Display',Georgia,serif",body:"'DM Sans',system-ui,sans-serif"},material:{display:"'Literata','Georgia',serif",body:"'Outfit',system-ui,sans-serif"}};
