import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { AiOutlineGlobal } from "react-icons/ai";
import { GiSouthKorea } from "react-icons/gi";
import { IoMdFemale, IoMdMale } from "react-icons/io";
import { toast } from "react-toastify";
import { getInfo, modify } from "../../api/memberAPI";
import { getCookie, setCookie } from "../../util/cookieUtil";
import useCustomTag from "../../hook/useCustomeTag";
import Loading from "../../etc/Loading";
import AddressList from "../../data/AddressList";

const initState = {
  userId: "",
  userPw: "",
  confirmPw: "",
  name: "",
  phoneNum: "",
  address: "-",
  birthDate: "",
  gender: "M",
  foreigner: false,
  roleName: "GENERAL",
};

const InfoMofiy = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { makeInput, makeSelect, makeRatio } = useCustomTag();

  const [member, setMember] = useState(initState);

  const [address, setAddress] = useState({
    regionList: [],
    region: "",
    cityList: [],
    city: "",
  });

  const [birthDate, setBirthDate] = useState({ year: "", month: "", date: "" });

  const refList = {
    userId: useRef(null),
    userPw: useRef(null),
    confirmPw: useRef(null),
    name: useRef(null),
    phoneNum: useRef(null),
    region: useRef(null),
    city: useRef(null),
    year: useRef(null),
    month: useRef(null),
    date: useRef(null),
  };

  useEffect(() => {
    setLoading(true);

    getInfo(member, getCookie("userId"))
      .then((dto) => {
        const { userPw, ...member } = dto;
        setMember(member);

        const code = member.address.split("-")[0];

        setAddress({
          regionList: AddressList().region,
          region: member.address.split("-")[0],
          cityList: code ? AddressList()[code] : [],
          city: member.address.split("-")[1],
        });

        setBirthDate({
          year: member.birthDate.split("-")[0] * 1,
          month: member.birthDate.split("-")[1] * 1,
          date: member.birthDate.split("-")[2] * 1,
        });
      })
      .catch((error) => {
        if (error.code === "ERR_NETWORK") {
          toast.error("서버연결에 실패했습니다.");
        } else {
          toast.error("회원정보를 불러오는데 실패했습니다.", { toastId: "e" });
        }
      });

    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);

    setAddress({
      ...address,
      regionList: AddressList().region,
      cityList: address.region ? AddressList()[address.region] : [],
    });

    setLoading(false);
  }, [address.region]);

  const onChange = ({ target: { name, value } }) => {
    setMember({ ...member, [name]: value });
  };

  const onChangeAddress = ({ target: { name, value } }) => {
    if (name === "region") {
      setAddress({
        ...address,
        region: value,
        city: "",
      });
      setMember({ ...member, address: `${value}-` });
    } else if (name === "city") {
      setAddress({ ...address, city: value });
      setMember({ ...member, address: `${address.region}-${value}` });
    }
  };

  const onChangeBirth = ({ target: { name, value } }) => {
    if (name === "year") {
      setBirthDate({ ...birthDate, year: value, month: "", date: "" });
    } else if (name === "month") {
      setBirthDate({ ...birthDate, month: value, date: "" });
    } else if (name === "date") {
      setBirthDate({ ...birthDate, date: value });
      setMember({
        ...member,
        birthDate: new Date(birthDate.year, birthDate.month - 1, value, 9),
      });
    }
  };

  const validField = () => {
    const validList = [
      [
        member.userPw &&
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,16}$/.test(
            member.userPw
          ),
        "올바르지 못한 비밀번호입니다. (영어 대소문자, 숫자, 특수기호 포함, 8~16글자)",
        refList.userPw,
        "userPw",
      ],
      [
        member.userPw && !member.confirmPw,
        "비밀번호 확인을 입력하세요.",
        refList.confirmPw,
      ],
      [
        member.userPw && member.confirmPw !== member.userPw,
        "입력하신 비밀번호가 다릅니다.",
        refList.confirmPw,
        "confirmPw",
      ],
      [!member.name, "이름을 입력하세요.", refList.name],
      [!member.phoneNum, "연락처를 입력하세요.", refList.phoneNum],
      [
        !/^\d{10,11}$/.test(member.phoneNum),
        '올바르지 못한 연락처입니다. ("-" 없이 숫자만 입력)',
        refList.phoneNum,
        "phoneNum",
      ],
      [!address.region, "주소-시/도를 선택하세요.", refList.region],
      [!address.city, "주소-시/구/군을 선택하세요.", refList.city],
      [!birthDate.year, "생녕월일 연도를 선택하세요.", refList.year],
      [!birthDate.month, "생년월일 월을 선택하세요.", refList.month],
      [!birthDate.date, "생년월일 일을 선택하세요.", refList.date],
    ];

    for (const [condition, message, ref, err] of validList) {
      if (condition) {
        err ? toast.error(message) : toast.warn(message);
        if (err === "userPw") {
          setMember({ ...member, userPw: "" });
        } else if (err === "confirmPw") {
          setMember({ ...member, confirmPw: "" });
        } else if (err === "phoneNum") {
          setMember({ ...member, phoneNum: "" });
        }
        ref?.current?.focus();
        return false;
      }
    }
    return true;
  };

  const onClickModify = async () => {
    setLoading(true);

    if (!validField()) return setLoading(false);

    await modify(member)
      .then((data) => {
        if (data.error) {
          toast.error("회원 가입에 실패했습니다.");
        } else if (data === 0) {
          toast.warn("이미 등록된 번호, 다시 입력하세요.");
          setMember({ ...member, phoneNum: "" });
          refList.phoneNum.current.focus();
        } else {
          setCookie("address", member.address);
          navigate(-1, { replace: true });
          setTimeout(() => {
            toast.success("회원정보 수정 완료");
          }, 100);
          setTimeout(() => {
            member.userPw && toast.success("비밀변호 변경 완료");
          }, 200);
        }
      })
      .catch((error) => {
        if (error.code === "ERR_NETWORK") {
          toast.error("서버연결에 실패했습니다.");
        } else {
          toast.error("회원정보 수정에 실패했습니다.");
        }
      });

    setLoading(false);
  };

  return (
    <>
      {loading && <Loading />}
      <div className="w-full text-xl text-center font-bold flex flex-col justify-center items-center">
        <div className="w-full py-4 border-b-4 border-gray-500 text-3xl text-left flex justify-between items-center">
          내 정보 - 수정
        </div>

        <div className="w-full px-20 py-4 flex flex-col justify-center items-center">
          <div className="w-full pb-2 border-b-4 border-gray-300 flex justify-end items-center space-x-4">
            <button
              className="bg-gray-500 px-4 py-2 rounded text-base text-white hover:bg-gray-300 hover:text-black transition duration-500"
              onClick={() => {
                navigate(-1, { replace: true });
              }}
            >
              취소
            </button>
            <button
              className="bg-sky-500 px-4 py-2 rounded text-base text-white hover:bg-sky-300 hover:text-black transition duration-500"
              onClick={onClickModify}
            >
              완료
            </button>
          </div>

          <>
            {/* 아이디 */}
            {makeRead(
              "아이디",
              makeInput(
                "text",
                "userId",
                member.userId,
                "",
                onChange,
                false,
                refList.userId,
                "w-full border-none rounded-none shadow-none"
              )
            )}

            {/* 비밀번호 */}
            {makeRead(
              "비밀번호",
              makeInput(
                "password",
                "userPw",
                member.userPw,
                "변경을 원할 경우에 입력",
                onChange,
                true,
                refList.userPw,
                "w-full border-none shadow-none"
              )
            )}

            {/* 비밀번호 확인 */}
            {makeRead(
              "비밀번호 확인",
              makeInput(
                "password",
                "confirmPw",
                member.confirmPw,
                "미입력 시 변경되지 않음",
                onChange,
                true,
                refList.confirmPw,
                "w-full border-none shadow-none"
              )
            )}

            {/* 이름 */}
            {makeRead(
              "이름",
              makeInput(
                "text",
                "name",
                member.name,
                "이름",
                onChange,
                true,
                refList.name,
                "w-full border-none shadow-none"
              )
            )}

            {/* 연락처 */}
            {makeRead(
              "연락처",
              makeInput(
                "text",
                "phoneNum",
                member.phoneNum,
                '"─" 없이 입력',
                onChange,
                true,
                refList.phoneNum,
                "w-full border-none shadow-none"
              )
            )}

            {/* 주소 */}
            {makeRead(
              "주소",
              <div className="w-full flex justify-center items-center space-x-1">
                {makeSelect(
                  "region",
                  address.region,
                  address.regionList,
                  "시/도 선택",
                  onChangeAddress,
                  true,
                  refList.region,
                  "w-1/2 border-none shadow-none"
                )}
                {makeSelect(
                  "city",
                  address.city,
                  address.cityList,
                  "시/구/군 선택",
                  onChangeAddress,
                  true,
                  refList.city,
                  "w-1/2 border-none shadow-none"
                )}
              </div>
            )}

            {/* 생년월일 */}
            {makeRead(
              "생년월일",
              <div className="w-full flex justify-center items-center space-x-1">
                {makeSelect(
                  "year",
                  birthDate.year,
                  Array.from(
                    { length: new Date().getFullYear() - 1900 + 1 },
                    (_, i) => 1900 + i
                  ).reverse(),
                  "연도 선택",
                  onChangeBirth,
                  true,
                  refList.year,
                  "w-1/3 border-none shadow-none"
                )}
                {makeSelect(
                  "month",
                  birthDate.month,
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                  "월 선택",
                  onChangeBirth,
                  true,
                  refList.month,
                  "w-1/3 border-none shadow-none"
                )}
                {makeSelect(
                  "date",
                  birthDate.date,
                  Array.from(
                    {
                      length: new Date(
                        birthDate.year,
                        birthDate.month,
                        0
                      ).getDate(),
                    },
                    (_, i) => i + 1
                  ),
                  "일 선택",
                  onChangeBirth,
                  true,
                  refList.date,
                  "w-1/3 border-none shadow-none"
                )}
              </div>
            )}

            {/* 성별 */}
            {makeRead(
              "성별",
              <div className="w-full flex justify-center items-center space-x-1">
                {makeRatio(
                  member.gender === "M",
                  IoMdMale,
                  "남성",
                  () =>
                    member.gender === "M" ||
                    setMember({ ...member, gender: "M" }),
                  true,
                  "w-1/2 border-none shadow-none"
                )}
                {makeRatio(
                  member.gender === "F",
                  IoMdFemale,
                  "여성",
                  () =>
                    member.gender === "F" ||
                    setMember({ ...member, gender: "F" }),
                  true,
                  "w-1/2 border-none shadow-none"
                )}
              </div>
            )}

            {/* 내외국인 */}
            {makeRead(
              "내와국인",
              <div className="w-full flex justify-center items-center space-x-1">
                {makeRatio(
                  !member.foreigner,
                  GiSouthKorea,
                  "내국인",
                  () => setMember({ ...member, foreigner: false }),
                  true,
                  "w-1/2 border-none shadow-none"
                )}
                {makeRatio(
                  member.foreigner,
                  AiOutlineGlobal,
                  "외국인",
                  () => setMember({ ...member, foreigner: true }),
                  true,
                  "w-1/2 border-none  shadow-none"
                )}
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};

const makeRead = (name, input, onlyRead) => {
  return (
    <div className="w-full text-base flex justify-center items-center">
      <div className="bg-gray-200 w-1/4 p-4 border-b-2 border-gray-300 text-nowrap">
        {name}
      </div>
      <div
        className={`${
          onlyRead && "p-4"
        } w-3/4 border-b-2 border-gray-300 text-left text-nowrap`}
      >
        {input}
      </div>
    </div>
  );
};

export default InfoMofiy;