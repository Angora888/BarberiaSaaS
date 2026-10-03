import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaBookOpen,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaCut,
  FaMoneyBillWave,
  FaPalette,
  FaRocket,
  FaShoppingBag,
  FaStore,
  FaUsers,
  FaUserTie
} from "react-icons/fa";

const BRAND_LOGO = "data:image/webp;base64,UklGRvAZAABXRUJQVlA4IOQZAACQXgCdASoAAQABPjEYikOiIaETOqygIAMEpu/Hwweck/d/yWsKdA/I7+oftl8ytS/kf3u/rH7VfJ7z3538yHxL8+/v39q/b//Kf////95b7rvcA/h38Y/y/9g/1H/d/zXca8wH7H/+D/Y+8l/Sf9V/TfdF/X/239wD+R/3b/x9gd+6nsBfuV///Zz/2n7Z/Bh+0f/p/zf/H///0Ifz/+7f8v8//kA/8fqAf+D1APUX7N/0juB/rP5U/1ftu/HvttoI/xL66fgP6p+3v5W8+vAF/G/45/mfyy/ITkwgA/Xv/edy56B/ZH2AP5X/UP95/cPOL8KegB/OP79/0v717rX8h/u/8d+V3tW/Mv7x/wP8N/lvkH/lH9R/2n98/e79//rI9f37Af+n3KP1l/95HMqq5EtDcIDJZCZHExFC9/4L5oEREMZrXn9Q3KBtJ2aWdLc61L/Kf+qf4////SerRy2cCMQ5hBBvo2vSoaKgwifY1c9uVnVBMzMwjhVVOzvauVXuJT1cdezrPo7lt1gPOpelaTVzMXPG2yiIiIi7nL82VB90UM5SMjt0Q/U6frehOTTqg+UuY0akkJ5rHKTyA4O15Z8BNwGZmK3HKQfbWYeBLTz9y5TxjwQ/4vMqPiba1vybbCu1+heFaKmXS6qsTNw1ScqpiEIDzBD5oBkCCbM/6mJC28LxUMF0A+sE5VVVVaKM+xXBPBnEDKnSdTMf0rkw8fsu45t/////OI5reNLfUzNxhsZrwbGGIn5dqgI5UMNm3sN41VVVLgN2v9LCumgiN9dZASTUSyiV7sj3w6nG1kTXhQw0LnJarkwqG1z86VDwrbBEjIgpuvyDR7E6uiUOqGQOuKqxSry9CEwg3Lyjo2JbGn3Ybf1xREkkCYHGtaishAYLOUe2NtCroBPDWL1XxSYt8EFf7IECzX4tDlv0PUifwap64LV9EeEyyz7fpt+jMmi5fV4Ejef1dPJT+c3n5mXI6of+s2MSCtbg4muruMriKWvXEjL5BVVVAAAA/v5jJ/88cW8LL+vyqK2HcPu6Jjw0dLd7NjMN6wpKpvb/mLijLCgktUPDW9tjDlMvktg8FmO6wc0nAjbjqFIFvbNDL8SPRww/ancsSr4J+ShTaAcwc/LelszisKBTWeOPzGclX/dXTWSNq1NpzoMqRphZ8rEPFPiK3w2ux1F+mY/g1sA8I1JUazuJ1nz6ayQ42fHgfLJmghkVocqJeOTXPmtp+nD/nummIvbmYUbhTcc54z1jEpjoqlnGUkgbwwvItwr6oi5cOJ7RzWAi/1zLCwgsgVfhRG4LYJ08pW0QB/T1allNStDIuUPpR51RcUDfr+6gpwClorBtm8vTWBZsFjzwB5f6VdDFLVIH2sYjbeuxD6QgInFV1j93tPNcOkhanxHqGzqLXRS4sZiIMJczFDo+s0fnW9DXFjSdGSFMmN6kyuN8b8LWkYf3K0GzVW5OYrD35FnHYpBAvMRY9xNQWfcWy94exVSbi4tMDl9lMxqwImcw5a7ujOjSU+S74R+eoJ+Zv2WnI6TmysyFyvkosYxIWWVWtwzyMjaGPCnva9nABgdMMNsU67bjY0GEZZ9E/FjvlliZ5aHgHil1+NoaW91XJ1znYHVLMpkxJNSNftQWXioDacK+mcn5v3u8YX3T6ieh4+5JIhQuM2Ycu3qizTCjXuYNY4KQo/nYrfqowYhNQPQAVfzMQlOOybrTIJhl6tRtM3xYLHelJdiz6NAXcK2Y3Gx4QID6DvHX9mO/D86RxtoZTHkbi8WH/fMJH1X++VbrXW/xK4eyX3q3eokddYAqLHx+bpeFbRIEg6q8dm3uP6gMBWv4rITA9e9//KryFZ0W4ii3Dtr9OXYiW8cxUj9ZPADpjoEHFxOFv0LvmbKrhsYT7/feaCsFmeoBroKFCCGJm5YLSxtKMI7gWmM3PzUt8qct78VYgRtnZcRVW9PN9UE388mEOAW0LETYJs3MOnzbKg/rAySy8OgPbqOufxZ8/OyDL/1PxnvpAxZBhIk4efyghM4DXqz86r1Li+l8yTGCrg1AWlgawihULX9n8LJK6LqaOTN009e61h549OkoGXaBifPp21WEPmDJsLZpmLpirCrD8uUnXswGLYfRTbhr56a0FMJQ3BDTWHZlB3gtxCcXMTkvk8WJVeaRotUQpT6LLRW5lzy/wVTSL4U2T5oo5uKltLIvM0he2za2eDsuCfY+m5wRP/BIoT3pTiRRLDtNDtjQcu335WpHP8l/mXT72pRKrNPl874JZkgED8Au1QWb7SWPc2r1kmeIwea+V35XZJxCwh7IaJ7a+cvAfg8lSv+7zMoErUjwxkUYiG4X7HQ/p58xtoY+f6F/6ieb8hQisO753C9DTLqBuFrpQ3FcnBxR29r6/g62Dsse29/ySp+4HXFhNCi/TSAnp10ZYgPr9PP2lDoqMQy66i+LJ3pl2hQ8+Tze8c1eYKavQD8ROEa0dmTpKDiYQvn86i6w1ZxzUmrNGKon4cvd6k0PvWGnz7rEjh1nSni/gBDHG47c3McyXYDFwVAvqv6xeSJvG++WqPt2vCMMW4D1E0V4JXD3I75kFPamV9b8Wf3XpmC6a4REIWc63TT55KbYohjHEP9/3SI8fVO9/I0ucYmWk4auh2N2SKapwA6nuYbwqWMkZN/hBtaWmbc9jUheKlL8Sb2ga3WhkHHky7/RXIYTMcIJT0POwCSpoXEvF0eU58IS04bQY/9fORpZHuLjquwhi0Y+FeEjrWeQ2DMV+ZmHO0xuZKgIdx0GCqNGAx8cxg3FyMBHmXN7EZR88VAFMWSfCMOHyDqZob01HQYljw3LqJ/M2o9nw+AsYWjIb+gJ8VHb/b/4nS+b40vVVVRB9767HCzl5S7fnUjC0wsgKeaecX1siVsyuxHEaRc3gMMgeHuWtaAaPv7En1UYZg/SP+6rTHyxzVDabMeuKV9jtsjQ1N7AvguxTqMcgw16y0LJ6A89l623C3Xn0k0+bYCwmmvJDV7IRagsoOK/XqHOUKaZhzgdYID15Y2C1goCYnMxkBwuFosE6aeBqpq16tfmpUH0npW3Uq8deslI9EzJFAzd8NeUKwBtO6oJ47c1v9diM0xtBedXjrCl7J+Y9LFWZkhUNZD7fc28/8Mx32ZNOWrARyAe0lM0QlnnzYPMLbSlbAaCpH9hX0Vmt7+j58E/ZiOxFUhtcqN/qYZNGZHTMdKWnppWotfC7+WVUPH0Tjj2ZWHWi9Ibnyy53FFN7PUxXXiv6wFZzTYQpvlEDiXC1Vvn6q5OofkWKQ1H10D4jnYHoNJbivtqp8waT9v/twncj0xZhu5LG6S05ZU+mY9Y1fAVb5W6P0nTaTkMu4XOzlEjAKt7eBasI+h8hrq3HpptUXkvbGC4emULpdbuDw3HrgMrOvcEVQ8Ycia/EMl+UE0jLIcW/1vKZOQTtsqJUodZDbFQ6/yelTfy3tyGtndhv6dMjS9/pGZOTUi95eArkURXSok5gJPqRDn9v+Oo/Zcomd9q9/5aHuqmFQQIuCjV2ldFZ4V+X3M/4FPBZBiyxwCyG4tZt7lTWqHe7k7xbR5kI7fHTGQT5UYx6ty4s312eix6rqnyt8P4JiujF9tNKfuSQrd6YuSwC89fItc2MpWditdSbM0uk+Z9l9ZwGkVF3kBPvoIT5ytH91Vw0ykEnmJmrvVPdKXtoccp3TwuL+Qk7hrnenzVyA5zi18h95sp8cazY7qkBZMP6qMMMjQ7T3HZDyMNZytFIokaJ/OJaxrQnY1SKmPeq34tuZnxabBrnWPMsdA2V9zoYvBzm26hqd0hR9bjMHOOA7oXaDAbHba8piDQJFhE8MLLid4DCfaluOqNaSfsMMWmvDZVLAbq5fHqi0mbq9ttp0AbD0HtfGlcbY8TInrIEHsgHDTugEQvj9MzvGPSCh7Ws/8IeTWpkZ0+eJAILfMyvxTVxit22lVdj9pj/WzIj6/J7z/7rQCYAMNpuekVK+BVbjRrZF1Nk1TEXgfOtFgKeNaLJT1i8qi7VBt/qTPOQ/Qx89rFOlkrAvRX8SDSSCZDpFascNI20veWMsIgWlYztvmIUxlNiLLm43Ve4iL8MIjiSankKYINHaMno6ubROXoRJTP0b69lAhxTlkoyDFGtvHJ4RiNhM2+zJ071OoFc7MJruJ4umLOCCLhgiVo7w3Ykl0mnjEl1q5Gdc6b7JgqA+3dCcusrB8Or8HN2YctgDOxsnBIHSGC4iyvgjEXh6GB9hwbVakaHmyVnzM15A6Qz2ab8PG4U+lAdnHoJo8uX4S1FtQa2hwzIF2RwR9t8KslIP0ARX7eWa4m+i0Ns0oFeF5/7cQcSQrsh1xJlpQ0W8JNMG4MiyqfbdeXFQK1EtjZ8q1gWZT87xmc4vP4+2FrRzaucLJtNw4Q0T2daUSmizvSXhavd3aCaE8O0Xl9PqmD9KiK/gvvTfUr3VBoxU+1Ez03H7D4DGQE/c8QgJLP/2XxpTgsYnPRClUG66V7s43rxm+TL0RxUw5aULxscfOJ5tV8j7jsIW/XfhYx6rb9YgjewW37qUcffauhMdtQ+09Hk3+Dax8Uunt4rRSimfwkO3WY8BSqjU6UdM6TjTQSAZD2ainPxn4g5xH0KmQnspe++UsdjeryWJIk3jFmHHLHZ0QdmspQDUe1LgAz7xruiI6ZMvXCPenhdfyH2hRXGeo3QIS5Rnp7EzfDr4WZT3hf4C/2eb4ugOcSgC1wOIIwpIOGPy40V0QEVty6xTGkDIyt8nzVx8OScuZbjlcf8N7ON0ObSisxsbOzpjky7BiLmIE+LV3MqgIusvaO+VBfzUMBSHEtmjbWQ5Ab3VQFH2ggLK81LT/8tr2sYd/cPCBXWzZf/u2/jZSlX/C7ojew5yikmznGqMO7ZP1cpr7kkMftY/MCYepMEFj6XlF+H7l91s8Oeq89wo7cD1lA9ucJUVMsprmZK9CXiB5VpZGer0RlXKNq/XXiLxpsb9B8jd5V716aAJ6Gym6YS+amsKqpyp6uZere7Tr+HF0spXoDjCjpq25r0rqyD87pzclzBmyURqC3BF3SeVZQfauOo336pb78KumctC409XeIGxH/PF7ZDpv6ATvtA31SHINpedaJxEAF3Fk8QjW9waIRwZpYzCn4sZxYCmwVxdUHYq+f8u14kZ0lJgdK9GZ7sxph4acvaY4OgHTSmSDZ5+5osJU0/jckT+4gQ8NasHhe0+RlgyNuFZCmzJ6NS+q00i+N9V31x63o2529mwG8X+YibAGypwAEUaqN6lLI5HLzKC5O7RWhDO0gUlkTb94YNHBbjf68V7eTfWP5CpyznT/lMRZTSRzjqSF2CRi2BO1P6eHQHJmZXMtHadwfpwGkt//G6XfSGZa2K+YdylDSck44PdOurpa3NUDAawCzEn8K9ZbJXBsrv8j1g3UtRhoe8hBHhvGvyVsiYr6//0uWfctgpbMjj/yrgjO+3StG4C+nLT3MLpkj4XN3/nrnZy9MrHgTv9YG/cQymKy1JfcxfNr8YdmtppWI0KUhi8oKKUTEkKF39Pk2XLN8lEPugMD8TU6HioVMib4KCo0LlbPMteUm3+8t2zX1PG2CNeryfqP71TnYdCw8RswPw66qpEzEe0JJM0BlwrcZodUACDmpA4qGVUdPpaWGyuMFAeqeijH5gV0yN0epMlGOa2J0PH1Yn4zhQf+t0N21ctiv2qwXQJMUxk3d3LLSrH/YITFcvS5QmR4nim3tn+TzPXZ9VClKGAluVtiLM8+/1Pjm7GI7NnId/VWMmy/K575P2yK/JsChnB5zK30DUQXCapN4SefEECXJp5TT9GYAK+Ck3bTwV/d/ZhMRxnBcabck6/O1tamqjfluSpFKcxnnlECKeQEYrcFUp6WMJCCVw/10sQSJTLivu227vIxtohtV2kDkOHCcNwnW2u2nVE/8n1yG4RDgcEhdlNjNFLAA8rtTjwwHJYFzz7IY2Pdv4FHY3KzYs0sqCyrfJDEBD1Y1HXS3h/1d6wvep+GnpQ+68ufTtBhq+2TbQQsjG1G3CWG2Ie2BZLn3LFO5wisjAOcNB2aEgwJu0GJYkEAdALiPtc4hD/eF2yht4rLJ+KrVUEoWzYhNW+cEHcH6h3ij9RUFcFOBPfOT7FT3gnlzX8d5Vj1KWs+dZV2IFGNCegIK9PaLzvIKUST1U9FUbYN5/T2PoHhRYE/6yJ+BxNkCb+YxTSbTXEQ5zzMhwFa78UkEwVfNnx6iSzICAc+9tBqpdtvFLqPQfrneCAjtPCvUxPxGLjCBEGKQKMukVGY7ukb+Qx55Uj3V1yLIudd8zVZjZQEo/8zUZk6FtOYQZEvVZnv5K/bidRuj8imRVWFfAXj8CVZLVB0kGRQ1fufOHjATYtno0euTrlxyan68LfrLP4zxfccXHS49FHb9iaxlVB/qQlptIH06HMOcA/Q5aaP6LopNuFcjOuPi0/RHIKSCZgpDAZmx7biVZ2EaDO3IhJmsIJMw92j4fUQr3Rzbfh9LKNSLpt4OadW16psn1nyNakuQY9QhjIJo4rnKMbFXuIbe7dFQKFp1PrmnxHd+lsl+Am2HfSYd5tZl9hiWpEwX1ZivFXtRMbdCLmbKgTZYGlLBNH2LCSsqNpvR0dW80B2qs8PuKGwiagb+O3FXMq0QWVk+nsr86cC40JmU8sKF+9s9qTJT63C2Dr9uoLjC4LqTZYL1t4opcWih1xB5cHBjlOcCfLqLb9zzSt2wGvpHdHHqV694adL+x+LCv5p916/tpa/VqaNboIihTn/PRQw0Jf75Qo6hCZl1T0UH9EMz7LlC4bOiqSYZZLFfTUb0M4ZqXwMQDhK7+mkx8jI6onlhs6Rr1s83nJ9zyveGX+IX/vUgXb/xEfbIvjI5LxRuLcXdmxEVS2Rq4pNZCFdl0FbeeNa3DBrATD0L/2Zr8fP1ZV6iOVuLWvFrvTtpHghKebLPM29Bb7ITTTNeoxeAuJ/7Jokk2PIQhx/gx6Eav35rNLUexKslgg9IuSfxDn75D0DUjvvYvl5Cq0lZm4pCZXaOr6PQ1YKgOhCrhWqVxVkIVX1ySQyd3ThIQaaJPvqE8LjRn5vtg+8EUZQHakfu1LACuzcNY2DgTUhFWLbuT24a3WOjAH8GrHXknp8h+ogQR9vzoqDxv0faCLscJ5IGFLkNTOyyd2NNR41LZdLN0uFEyEPv9ng+gDVh5IQIJp7fd27bKNVuKoU2pziDrICcf0U15h/8im0vB50E5urxbAwuR9bIWifnMxf74VKGfw7NqN/mjF07IeIiYzxv9qbNevdnvQeeZnWYY85DcLGW7x1nxEP1kp5OeUOpxykq2ZvEZDVN8Ym6AInmsyP+CMfPB9Xd4cY8w6eh6fNCbDF+1oeLCzi3ycDpuXDQ+3NjTpdlsTXkL0S8TputpJZfNsVybt+l7zDwizn4125nCpDYx6XlwNynD+sZbUa8qFINvLyR8DTe1C5iNuIsomKtuoYRDJgfTIMtB08/wOaw32mEsGc5IFojEMFe7blIzd3evCHrtIlCPviY7Al1UfsAZBR+iLvHDF/2esSFlGgWbZRfW0P/YsIHWkiinK82cvM9CbA1tiKw8B4A7TA1or7M9IjyctRYX3QYBTAW4W8aZMF0RNOfoMCqb1goehSFRjDjoWZN4CgPZ0EmVDN9uBF6TN3gULN+L6OT4yR5Rxmt1RcHx6E8xwjy9DKvxgqcbZwUBoT66+fzLyCvcP5nU+Ov5GxMFVqmM07+7NCNsbG+1BuYD/wE6UbhcwgeZBSwCtEZrMmjfgaSpeAXdtjYB5AoRLhE4MPV24obgOAFKBQJVd4mceFfVw//waTvhpNaakYpaljCXZdoztgBSJuGB/WB5RtMpQ214GWwf9EV8pC3HgUkP4G5d3NdivLPcVWeFHJ6hWjvQtX918gpL0utn7+QP5hV9dwZMWI0GAlrm1sTYAKEe1JvvKainE+zcB/9cdk/uflR/O997KpOqDLntekWOAX9vHuPgvZR8wRyDK30MD+U9bZNHXMGgNNpEsw3pcKPMdkH4a5EfDi/FpMF164oVqOEpKc/xZQ/FaXsVArBthZszWzjCSx7evKVb3/h7RZuabF/JXLU2BrcVDtBSRiD2DWJ58FoIJ9UQvY3fTrhW57iwNfuK433MNtnq9fdTehSHE2CdTOfIQgfGNIcMu8mC3rK3von6zy/3fbSBP3YzfztKJHEPTwQ7m8dOmjUDBLCEUqzm1FTdhhbLqM0EyLRtRoKcPU8JT52KpzZXfvZl9+AVxQRZTczgP5Iow7V3bCpBPfHADMyhHoBgBS3wtorCHmywmN1HnETsVokfIwX29ZOmNNB10roUuI3MTf/y15b/sAIz+OGQwkuPvFDPhUYBXtEsTM1E/njv0hnyZn+KRAPmfzdR8D8nefTS/Hn98Z/yeQ4zg+79gRkQYoEqR9t8Xs1r7+bH4e5V9kRXh52B/dAisDtEG1uEuQecBvJIwqO/FFcvvEoutFVnnIdxR37AOKMnNNajSrHKZjLbswVYqtJs8FJ5wShNtmOpSJSWp+nQimRG+Ky9C4FzuJ/4loC5MZyHt9a4u2adfMCSLiix/tEfVzN2wsfYtaQJvh9Zl8cnf1TwPCot4ygPxorifiNXHWWn6uu9VvCLe99NMrYG3nuTtrZFXu8ELuBBjy5V725ZrQkDwRoqKSZbLWNU1kct2r0kgJiRcVy9h+zVgYBJttx1HyWKKA+1CGVJL1QI+vx0fqQDn22N2ESlqTlg8QFgLBjUQWxNwuQ13S18ABfYm5R6vnD1iNpWt6wa3ExgPRS2csHTXIR+XY/uKZl+H6AfcTD1s21AAAA";

const COLORS = {
  navy: "#071a46",
  navy2: "#102b63",
  gold: "#f4c64f",
  gold2: "#ffdc73",
  text: "#111827",
  muted: "#667085",
  bg: "#f7f8fc"
};

function Home() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const estaLogueado = Boolean(localStorage.getItem("token"));

  const irASeccion = (id) => {
    setMenuAbierto(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const rutaAcceso = estaLogueado ? "/dashboard" : "/login";
  const textoAcceso = estaLogueado ? "Volver al dashboard" : "Iniciar sesión";

  const funciones = [
    {
      icono: <FaCalendarAlt />,
      titulo: "Agenda inteligente",
      texto: "Organiza citas por profesional, horarios, bloqueos, disponibilidad y duración de cada servicio."
    },
    {
      icono: <FaUsers />,
      titulo: "Clientes",
      texto: "Mantén los datos e historial de tus clientes organizados y disponibles cuando los necesites."
    },
    {
      icono: <FaCut />,
      titulo: "Servicios y variantes",
      texto: "Administra servicios, precios y variantes sin duplicar tu catálogo."
    },
    {
      icono: <FaUserTie />,
      titulo: "Profesionales",
      texto: "Asigna servicios, horarios y actividad a cada profesional de tu equipo."
    },
    {
      icono: <FaShoppingBag />,
      titulo: "Productos e inventario",
      texto: "Vende productos, controla existencias por sucursal y registra movimientos."
    },
    {
      icono: <FaChartBar />,
      titulo: "Dashboard y reportes",
      texto: "Consulta ingresos, servicios, productos, métodos de pago y resultados."
    }
  ];

  return (
    <div className="bs-home min-vh-100">
      <style>{`
        .bs-home { background: #fff; color: ${COLORS.text}; }
        .bs-nav {
          background: rgba(7, 26, 70, .97);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,.09);
        }
        .bs-brand-logo {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          object-fit: cover;
          box-shadow: 0 8px 24px rgba(0,0,0,.22);
        }
        .bs-brand-title {
          color: #fff;
          font-weight: 800;
          letter-spacing: -.4px;
        }
        .bs-brand-title span { color: ${COLORS.gold}; }
        .bs-nav-link {
          color: rgba(255,255,255,.86) !important;
          font-weight: 600;
        }
        .bs-nav-link:hover { color: ${COLORS.gold} !important; }
        .bs-gold-btn {
          background: ${COLORS.gold};
          border-color: ${COLORS.gold};
          color: #0b1738;
          font-weight: 800;
        }
        .bs-gold-btn:hover {
          background: ${COLORS.gold2};
          border-color: ${COLORS.gold2};
          color: #0b1738;
        }
        .bs-outline-light {
          border: 1px solid rgba(255,255,255,.45);
          color: #fff;
          font-weight: 700;
        }
        .bs-outline-light:hover {
          background: #fff;
          color: ${COLORS.navy};
        }
        .bs-hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 80% 20%, rgba(244,198,79,.18), transparent 34%),
            linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navy2} 100%);
          color: #fff;
        }
        .bs-hero:after {
          content: "";
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          right: -180px;
          bottom: -220px;
          background: rgba(244,198,79,.10);
        }
        .bs-kicker {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 999px;
          color: ${COLORS.gold2};
          border: 1px solid rgba(244,198,79,.35);
          background: rgba(244,198,79,.08);
          font-weight: 700;
          font-size: .9rem;
        }
        .bs-hero-title {
          font-size: clamp(2.8rem, 6vw, 5.2rem);
          line-height: .98;
          letter-spacing: -3px;
          font-weight: 850;
        }
        .bs-hero-title .gold { color: ${COLORS.gold}; }
        .bs-hero-copy {
          color: rgba(255,255,255,.74);
          max-width: 700px;
          font-size: 1.18rem;
        }
        .bs-check { color: rgba(255,255,255,.76); }
        .bs-check svg { color: ${COLORS.gold}; }
        .bs-dashboard-shell {
          position: relative;
          z-index: 1;
          border-radius: 30px;
          padding: 14px;
          background: linear-gradient(145deg, rgba(255,255,255,.15), rgba(255,255,255,.05));
          border: 1px solid rgba(255,255,255,.16);
          box-shadow: 0 32px 80px rgba(0,0,0,.32);
        }
        .bs-dashboard {
          border-radius: 22px;
          overflow: hidden;
          background: #fff;
          color: ${COLORS.text};
        }
        .bs-metric {
          border: 1px solid #e8ecf2;
          border-radius: 16px;
          padding: 16px;
          height: 100%;
        }
        .bs-metric strong { color: ${COLORS.navy}; }
        .bs-strip {
          background: #fff;
          border-bottom: 1px solid #eef0f4;
        }
        .bs-strip strong { color: ${COLORS.navy}; }
        .bs-section { padding: 88px 0; }
        .bs-section-soft { background: ${COLORS.bg}; }
        .bs-section-title {
          color: ${COLORS.navy};
          font-weight: 850;
          letter-spacing: -1.5px;
        }
        .bs-overline {
          color: #aa7f12;
          font-weight: 800;
          letter-spacing: .12em;
          text-transform: uppercase;
          font-size: .76rem;
        }
        .bs-feature-card {
          border: 1px solid #e9edf3;
          border-radius: 22px;
          padding: 26px;
          background: #fff;
          height: 100%;
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
        }
        .bs-feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(244,198,79,.55);
          box-shadow: 0 18px 45px rgba(7,26,70,.10);
        }
        .bs-icon {
          width: 54px;
          height: 54px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: ${COLORS.navy};
          color: ${COLORS.gold};
          font-size: 22px;
          margin-bottom: 18px;
        }
        .bs-benefit {
          border: 1px solid #e8ecf2;
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          height: 100%;
        }
        .bs-benefit svg { color: #b88a13; }
        .bs-step-number {
          color: ${COLORS.gold};
          background: ${COLORS.navy};
          width: 52px;
          height: 52px;
          border-radius: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          margin-bottom: 18px;
        }
        .bs-cta {
          background:
            radial-gradient(circle at 20% 20%, rgba(244,198,79,.18), transparent 35%),
            linear-gradient(135deg, ${COLORS.navy} 0%, #020817 100%);
          border-radius: 30px;
          color: #fff;
          overflow: hidden;
          position: relative;
        }
        .bs-cta-logo {
          width: 84px;
          height: 84px;
          border-radius: 20px;
          object-fit: cover;
          box-shadow: 0 14px 35px rgba(0,0,0,.28);
        }
        .bs-footer {
          background: #030b1f;
          color: rgba(255,255,255,.65);
        }
        .bs-footer a { color: rgba(255,255,255,.68); }
        .bs-footer a:hover { color: ${COLORS.gold}; }
        @media (max-width: 991px) {
          .bs-nav .navbar-collapse {
            padding-top: 18px;
          }
          .bs-hero-title { letter-spacing: -2px; }
          .bs-section { padding: 66px 0; }
        }
      `}</style>

      <nav className="navbar navbar-expand-lg bs-nav sticky-top navbar-dark">
        <div className="container py-2">
          <button
            type="button"
            className="navbar-brand border-0 bg-transparent p-0 d-flex align-items-center gap-3"
            onClick={() => irASeccion("inicio")}
          >
            <img src={BRAND_LOGO} alt="Barbería SaaS" className="bs-brand-logo" />
            <span className="bs-brand-title fs-4">
              Barbería <span>SaaS</span>
            </span>
          </button>

          <button
            className="navbar-toggler"
            type="button"
            aria-label="Abrir menú"
            onClick={() => setMenuAbierto((actual) => !actual)}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`collapse navbar-collapse ${menuAbierto ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto align-items-lg-center gap-3 gap-lg-2">
              <li className="nav-item">
                <button className="nav-link bs-nav-link border-0 bg-transparent" onClick={() => irASeccion("funciones")}>
                  Funciones
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link bs-nav-link border-0 bg-transparent" onClick={() => irASeccion("beneficios")}>
                  Beneficios
                </button>
              </li>
              <li className="nav-item">
                <Link to="/manual" className="nav-link bs-nav-link" onClick={() => setMenuAbierto(false)}>
                  Manual
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/prueba" className="btn bs-gold-btn px-3" onClick={() => setMenuAbierto(false)}>
                  Probar gratis
                </Link>
              </li>
              <li className="nav-item ms-lg-1">
                <Link to={rutaAcceso} className="btn bs-outline-light px-3" onClick={() => setMenuAbierto(false)}>
                  {textoAcceso}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main>
        <section id="inicio" className="bs-hero">
          <div className="container py-5">
            <div className="row align-items-center g-5 py-lg-5">
              <div className="col-lg-6 py-4">
                <div className="bs-kicker mb-4">
                  <FaCut />
                  Tecnología para barberías y negocios de belleza
                </div>

                <h1 className="bs-hero-title mb-4">
                  Tu negocio, <span className="gold">organizado</span> en un solo lugar.
                </h1>

                <p className="bs-hero-copy mb-4">
                  Administra agenda, clientes, profesionales, servicios, ventas, inventario y reportes desde una sola plataforma.
                </p>

                <div className="d-flex flex-wrap gap-3">
                  <Link to="/prueba" className="btn bs-gold-btn btn-lg px-4">
                    <FaRocket className="me-2" />
                    Comenzar ahora
                  </Link>
                  <Link to="/manual" className="btn bs-outline-light btn-lg px-4">
                    <FaBookOpen className="me-2" />
                    Ver cómo funciona
                  </Link>
                </div>

                <div className="mt-4">
                  <Link to={rutaAcceso} className="text-white text-decoration-none fw-semibold">
                    {textoAcceso}
                    <FaArrowRight className="ms-2" />
                  </Link>
                </div>

                <div className="d-flex flex-wrap gap-4 mt-5 bs-check">
                  <div><FaCheckCircle className="me-2" />Fácil de usar</div>
                  <div><FaCheckCircle className="me-2" />Acceso desde web</div>
                  <div><FaCheckCircle className="me-2" />Multi-sucursal</div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="bs-dashboard-shell">
                  <div className="bs-dashboard">
                    <div className="border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <img src={BRAND_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
                        <strong>Barbería SaaS</strong>
                      </div>
                      <small className="text-secondary">Dashboard</small>
                    </div>

                    <div className="p-4">
                      <div className="row g-3 mb-3">
                        {[
                          ["Ingresos hoy", "₡185,000"],
                          ["Citas", "12"],
                          ["Clientes", "248"],
                          ["Ventas", "₡42,500"]
                        ].map(([titulo, valor]) => (
                          <div className="col-6" key={titulo}>
                            <div className="bs-metric">
                              <div className="small text-secondary">{titulo}</div>
                              <strong className="fs-5 d-block mt-1">{valor}</strong>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border rounded-4 p-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong>Próximas citas</strong>
                          <span className="badge rounded-pill" style={{ background: "#fff4cc", color: "#805f00" }}>Hoy</span>
                        </div>
                        {[
                          ["9:00", "María Rodríguez", "Balayage"],
                          ["10:30", "Andrea Mora", "Corte y peinado"],
                          ["12:00", "Sofía Vargas", "Manicure"]
                        ].map(([hora, cliente, servicio]) => (
                          <div key={`${hora}-${cliente}`} className="d-flex justify-content-between gap-3 py-2 border-top">
                            <strong>{hora}</strong>
                            <div className="flex-grow-1">
                              <div className="fw-semibold">{cliente}</div>
                              <small className="text-secondary">{servicio}</small>
                            </div>
                            <FaCalendarAlt style={{ color: COLORS.navy }} className="mt-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bs-strip">
          <div className="container py-4">
            <div className="row g-4 text-center">
              {[
                ["Agenda", "Citas organizadas"],
                ["Clientes", "Historial centralizado"],
                ["Caja", "Ventas e ingresos"],
                ["Reportes", "Decisiones con datos"]
              ].map(([titulo, texto]) => (
                <div className="col-6 col-md-3" key={titulo}>
                  <strong className="fs-4 d-block">{titulo}</strong>
                  <small className="text-secondary">{texto}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="funciones" className="bs-section">
          <div className="container">
            <div className="text-center mx-auto mb-5" style={{ maxWidth: 780 }}>
              <div className="bs-overline">Todo conectado</div>
              <h2 className="display-5 bs-section-title mt-2">Todo lo que necesitas para operar mejor</h2>
              <p className="lead text-secondary">
                Menos trabajo manual, más orden y más tiempo para atender a tus clientes.
              </p>
            </div>

            <div className="row g-4">
              {funciones.map((item) => (
                <div className="col-md-6 col-lg-4" key={item.titulo}>
                  <div className="bs-feature-card">
                    <div className="bs-icon">{item.icono}</div>
                    <h4 className="fw-bold" style={{ color: COLORS.navy }}>{item.titulo}</h4>
                    <p className="text-secondary mb-0">{item.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="bs-section bs-section-soft">
          <div className="container">
            <div className="row align-items-center g-5">
              <div className="col-lg-5">
                <div className="bs-overline">Beneficios</div>
                <h2 className="display-5 bs-section-title mt-2">Control profesional sin complicar tu operación</h2>
                <p className="lead text-secondary">
                  Una experiencia clara para tu equipo y una visión completa para la administración.
                </p>
              </div>
              <div className="col-lg-7">
                <div className="row g-3">
                  {[
                    [<FaCalendarAlt />, "Menos desorden", "Agenda, horarios, bloqueos y profesionales en un único sistema."],
                    [<FaMoneyBillWave />, "Control de ingresos", "Separa ingresos por servicios y productos y consulta tus resultados."],
                    [<FaStore />, "Preparado para crecer", "Multi-tenant y multi-sucursal para crecer sin rehacer el sistema."],
                    [<FaPalette />, "Tu propia identidad", "Personaliza logo, colores, moneda, zona horaria y datos del negocio."]
                  ].map(([icono, titulo, texto]) => (
                    <div className="col-md-6" key={titulo}>
                      <div className="bs-benefit">
                        <div className="fs-3 mb-3">{icono}</div>
                        <h5 className="fw-bold" style={{ color: COLORS.navy }}>{titulo}</h5>
                        <p className="text-secondary mb-0">{texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="bs-section">
          <div className="container">
            <div className="text-center mx-auto mb-5" style={{ maxWidth: 720 }}>
              <div className="bs-overline">Cómo funciona</div>
              <h2 className="display-5 bs-section-title mt-2">Empieza en pocos pasos</h2>
            </div>

            <div className="row g-4">
              {[
                ["01", "Crea tu negocio", "Regístrate desde la prueba y tu espacio queda listo automáticamente."],
                ["02", "Configura tu operación", "Agrega sucursales, servicios, profesionales, horarios, clientes y productos."],
                ["03", "Empieza a trabajar", "Agenda citas, cobra servicios, vende productos y consulta tus resultados."]
              ].map(([numero, titulo, texto]) => (
                <div className="col-md-4" key={numero}>
                  <div className="bs-feature-card">
                    <div className="bs-step-number">{numero}</div>
                    <h4 className="fw-bold" style={{ color: COLORS.navy }}>{titulo}</h4>
                    <p className="text-secondary mb-0">{texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-5">
          <div className="container">
            <div className="bs-cta p-4 p-md-5 text-center">
              <img src={BRAND_LOGO} alt="Barbería SaaS" className="bs-cta-logo mb-4" />
              <h2 className="display-5 fw-bold">Moderniza tu negocio desde hoy.</h2>
              <p className="lead mx-auto" style={{ maxWidth: 720, color: "rgba(255,255,255,.72)" }}>
                Crea tu cuenta, configura tu negocio y empieza a trabajar desde una sola plataforma.
              </p>
              <div className="d-flex flex-wrap justify-content-center gap-3 mt-4">
                <Link to="/prueba" className="btn bs-gold-btn btn-lg px-4">
                  Probar Barbería SaaS
                  <FaArrowRight className="ms-2" />
                </Link>
                <Link to="/manual" className="btn bs-outline-light btn-lg px-4">
                  Manual de la aplicación
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bs-footer">
        <div className="container py-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-2">
            <img src={BRAND_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
            <span>© {new Date().getFullYear()} Barbería SaaS</span>
          </div>
          <div className="d-flex flex-wrap gap-3">
            <Link to="/manual" className="text-decoration-none">Manual</Link>
            <Link to="/privacidad" className="text-decoration-none">Privacidad</Link>
            <Link to="/terminos" className="text-decoration-none">Términos</Link>
            <Link to="/eliminar-cuenta" className="text-decoration-none">Eliminar cuenta</Link>
            <Link to="/prueba" className="text-decoration-none">Probar la aplicación</Link>
            <Link to="/login" className="text-decoration-none">Iniciar sesión</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
